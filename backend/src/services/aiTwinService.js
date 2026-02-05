const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const catalogAnalysisService = require('./catalogAnalysisService');
const visualDnaCache = require('./visualDnaCache');
const clarosaService = require('./clarosaServiceDirect');

/**
 * AI Twin Service
 * Generates content using LLM trained on user's aesthetic DNA
 * DIFFERENTIATOR: Personal AI trained on YOUR proven taste, not generic ChatGPT
 */
class AITwinService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    this.provider = process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai';
    this.model = this.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4';
    this.dbPath = path.join(__dirname, '../../starforge_audio.db');
  }

  /**
   * Get complete aesthetic DNA for user
   * Combines Visual DNA + Audio DNA + Taste Profile
   */
  async getAestheticDNA(userId) {
    try {
      // Get Audio DNA from catalog analysis
      const audioDNA = await catalogAnalysisService.getCatalogAnalysis(userId);

      // Get Visual DNA from CLAROSA
      const clarosaProfile = clarosaService.getUserProfile(userId === 'default_user' ? 1 : userId);
      let visualDNA = null;

      if (clarosaProfile && clarosaProfile.stats.total_photos > 0) {
        const photos = clarosaService.getTopPhotos(userId === 'default_user' ? 1 : userId, 50, 0.60);
        if (photos && photos.length > 0) {
          visualDNA = visualDnaCache.getCached(userId === 'default_user' ? 1 : userId, photos);
        }
      }

      // Get Influence Genealogy if available
      let influenceGenealogy = null;
      if (audioDNA.influenceGenealogy) {
        influenceGenealogy = audioDNA.influenceGenealogy;
      }

      return {
        available: true,
        audio: {
          trackCount: audioDNA.trackCount,
          avgBpm: audioDNA.aggregateStats?.avgBpm,
          avgEnergy: audioDNA.aggregateStats?.avgEnergy,
          avgValence: audioDNA.aggregateStats?.avgValence,
          genres: audioDNA.genreDistribution?.slice(0, 5).map(g => g.genre),
          tasteCoherence: audioDNA.tasteCoherence?.overall,
          influences: influenceGenealogy?.genealogy?.map(g => g.genre).slice(0, 5) || []
        },
        visual: visualDNA ? {
          styleDescription: visualDNA.styleDescription,
          colorPalette: visualDNA.colorPalette?.map(c => c.name).slice(0, 5),
          paletteCharacteristics: visualDNA.paletteCharacteristics,
          themes: visualDNA.dominantThemes?.slice(0, 5)
        } : null
      };
    } catch (error) {
      console.error('Error getting aesthetic DNA:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Build context prompt from aesthetic DNA
   */
  buildAestheticContext(aestheticDNA) {
    const { audio, visual } = aestheticDNA;

    let context = 'Artist Profile:\n\n';

    // Audio DNA
    if (audio) {
      context += `Music Taste:\n`;
      context += `- ${audio.trackCount} tracks analyzed\n`;
      context += `- BPM preference: ${audio.avgBpm?.toFixed(0)} (${this.describeTempo(audio.avgBpm)})\n`;
      context += `- Energy level: ${(audio.avgEnergy * 100)?.toFixed(0)}% (${this.describeEnergy(audio.avgEnergy)})\n`;
      context += `- Mood: ${(audio.avgValence * 100)?.toFixed(0)}% valence (${this.describeValence(audio.avgValence)})\n`;

      if (audio.genres && audio.genres.length > 0) {
        context += `- Genre influences: ${audio.genres.join(', ')}\n`;
      }

      if (audio.influences && audio.influences.length > 0) {
        context += `- Core influences: ${audio.influences.join(', ')}\n`;
      }

      context += `- Taste coherence: ${(audio.tasteCoherence * 100)?.toFixed(0)}% (${this.describeCoherence(audio.tasteCoherence)})\n`;
      context += '\n';
    }

    // Visual DNA
    if (visual) {
      context += `Visual Aesthetic:\n`;
      context += `- Style: ${visual.styleDescription}\n`;

      if (visual.colorPalette && visual.colorPalette.length > 0) {
        context += `- Color palette: ${visual.colorPalette.join(', ')}\n`;
      }

      if (visual.paletteCharacteristics) {
        context += `- Palette: ${visual.paletteCharacteristics}\n`;
      }

      if (visual.themes && visual.themes.length > 0) {
        context += `- Visual themes: ${visual.themes.join(', ')}\n`;
      }

      context += '\n';
    }

    return context;
  }

  /**
   * Generate artist bio using aesthetic DNA
   */
  async generateArtistBio(userId, options = {}) {
    try {
      const aestheticDNA = await this.getAestheticDNA(userId);

      if (!aestheticDNA.available) {
        return {
          success: false,
          error: 'Insufficient aesthetic DNA. Upload music and/or connect CLAROSA.'
        };
      }

      const context = this.buildAestheticContext(aestheticDNA);
      const tone = options.tone || 'sophisticated'; // sophisticated, casual, minimal, poetic
      const length = options.length || 'medium'; // short (100w), medium (200w), long (300w)

      const prompt = this.buildBioPrompt(context, tone, length);

      const bio = await this.callLLM(prompt);

      // Save to generation history
      this.saveGenerationHistory(userId, 'artist_bio', prompt, bio);

      return {
        success: true,
        bio,
        usedAestheticDNA: {
          audioTracks: aestheticDNA.audio?.trackCount,
          visualPhotos: aestheticDNA.visual ? 'connected' : 'not connected',
          coherence: aestheticDNA.audio?.tasteCoherence
        }
      };
    } catch (error) {
      console.error('Error generating artist bio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate social media caption
   */
  async generateCaption(userId, context = '', options = {}) {
    try {
      const aestheticDNA = await this.getAestheticDNA(userId);

      if (!aestheticDNA.available) {
        return {
          success: false,
          error: 'Insufficient aesthetic DNA. Upload music and/or connect CLAROSA.'
        };
      }

      const aestheticContext = this.buildAestheticContext(aestheticDNA);
      const style = options.style || 'minimal'; // minimal, poetic, technical, hype

      const prompt = `${aestheticContext}

Context: ${context}

Write a social media caption in a ${style} style that matches this artist's aesthetic.
${style === 'minimal' ? 'Keep it under 50 words. No hashtags.' : ''}
${style === 'poetic' ? 'Evocative, artistic language.' : ''}
${style === 'technical' ? 'Include production/musical details.' : ''}
${style === 'hype' ? 'Build excitement, more energetic.' : ''}

The caption should feel authentic to their proven taste, not generic AI.`;

      const caption = await this.callLLM(prompt);

      this.saveGenerationHistory(userId, 'caption', prompt, caption);

      return {
        success: true,
        caption
      };
    } catch (error) {
      console.error('Error generating caption:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate press release paragraph
   */
  async generatePressRelease(userId, eventContext = '', options = {}) {
    try {
      const aestheticDNA = await this.getAestheticDNA(userId);

      if (!aestheticDNA.available) {
        return {
          success: false,
          error: 'Insufficient aesthetic DNA. Upload music and/or connect CLAROSA.'
        };
      }

      const aestheticContext = this.buildAestheticContext(aestheticDNA);

      const prompt = `${aestheticContext}

Event/Release Context: ${eventContext}

Write a professional press release paragraph (150-200 words) for this artist.
- Sophisticated, tastemaker voice
- Reference their aesthetic DNA naturally
- Focus on cultural positioning, not hype
- Sound like a curator wrote it, not marketing`;

      const pressRelease = await this.callLLM(prompt);

      this.saveGenerationHistory(userId, 'press_release', prompt, pressRelease);

      return {
        success: true,
        pressRelease
      };
    } catch (error) {
      console.error('Error generating press release:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build bio generation prompt
   */
  buildBioPrompt(aestheticContext, tone, length) {
    const lengthMap = {
      short: '100 words',
      medium: '200 words',
      long: '300 words'
    };

    const toneMap = {
      sophisticated: 'Sophisticated, tastemaker voice. Cultural curator aesthetic.',
      casual: 'Conversational, authentic. Like talking to a friend.',
      minimal: 'Sparse, poetic. Every word counts.',
      poetic: 'Evocative, artistic. Paint with words.'
    };

    return `${aestheticContext}

Write an artist bio (${lengthMap[length]}) in this style: ${toneMap[tone]}

Requirements:
- Reference their proven musical taste (BPM, energy, genres, influences)
- Reference visual aesthetic if available
- Sound like THEM, not generic AI
- No clichés ("passion for music", "unique sound")
- Cultural positioning over self-promotion
- Make it feel earned, not aspirational

Write the bio now:`;
  }

  /**
   * Call LLM (Anthropic Claude or OpenAI GPT-4)
   */
  async callLLM(prompt) {
    if (this.provider === 'anthropic') {
      return await this.callClaude(prompt);
    } else {
      return await this.callOpenAI(prompt);
    }
  }

  /**
   * Call Anthropic Claude API
   */
  async callClaude(prompt) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Call OpenAI GPT-4 API
   */
  async callOpenAI(prompt) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing artist bios and content that matches their aesthetic DNA. Write in their voice, not generic AI.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Save generation to history
   */
  saveGenerationHistory(userId, type, prompt, output) {
    try {
      const db = new Database(this.dbPath);

      // Create table if not exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_generations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          generation_type TEXT NOT NULL,
          prompt TEXT,
          output TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.prepare(`
        INSERT INTO ai_generations (user_id, generation_type, prompt, output)
        VALUES (?, ?, ?, ?)
      `).run(userId, type, prompt, output);

      db.close();
    } catch (error) {
      console.error('Error saving generation history:', error);
    }
  }

  // Helper description methods
  describeTempo(bpm) {
    if (!bpm) return 'varied';
    if (bpm < 90) return 'downtempo/ambient';
    if (bpm < 110) return 'mid-tempo';
    if (bpm < 128) return 'house tempo';
    if (bpm < 140) return 'techno tempo';
    return 'high-energy';
  }

  describeEnergy(energy) {
    if (!energy) return 'varied';
    if (energy < 0.3) return 'contemplative, low-energy';
    if (energy < 0.5) return 'moderate, balanced';
    if (energy < 0.7) return 'energetic';
    return 'high-intensity';
  }

  describeValence(valence) {
    if (!valence) return 'varied';
    if (valence < 0.3) return 'dark, melancholic';
    if (valence < 0.5) return 'introspective';
    if (valence < 0.7) return 'positive, uplifting';
    return 'euphoric, bright';
  }

  describeCoherence(coherence) {
    if (!coherence) return 'eclectic';
    if (coherence < 0.5) return 'highly eclectic, diverse taste';
    if (coherence < 0.7) return 'moderately focused';
    return 'highly focused, coherent';
  }
}

module.exports = new AITwinService();
