const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// SINK Integration Service
// Connects to SINK audio processing for mood analysis and features

class SinkService {
  constructor() {
    // SINK might run as FastAPI service or direct Python calls
    this.sinkBaseUrl = process.env.SINK_URL || 'http://localhost:8001';
    this.sinkPath = process.env.SINK_PATH || '/home/sphinxy/SINK';
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
  }

  /**
   * Analyze audio file for mood, energy, and musical features
   * @param {string} audioFilePath - Path to audio file
   * @returns {Promise<Object>} - Mood and feature analysis
   */
  async analyzeMood(audioFilePath) {
    try {
      // Try SINK API first
      const response = await axios.post(`${this.sinkBaseUrl}/api/audio/analyze`, {
        file_path: audioFilePath
      });

      return this.normalizeAnalysisResult(response.data);
    } catch (error) {
      console.log('SINK API unavailable, using direct Python call');

      // Fallback: Call Python script directly
      return this.analyzeMoodDirect(audioFilePath);
    }
  }

  /**
   * Direct Python call to SINK mood analyzer
   */
  async analyzeMoodDirect(audioFilePath) {
    return new Promise((resolve, reject) => {
      // Call SINK's mood_analyzer.py directly
      const scriptPath = path.join(
        this.sinkPath,
        'audio-processing/processors/mood_analyzer.py'
      );

      const pythonProcess = spawn(this.pythonPath, [
        scriptPath,
        '--file', audioFilePath,
        '--format', 'json'
      ]);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', errorData);
          // Return mock data for development
          resolve(this.getMockAnalysis());
        } else {
          try {
            const result = JSON.parse(outputData);
            resolve(this.normalizeAnalysisResult(result));
          } catch (parseError) {
            console.error('Failed to parse analysis result:', parseError);
            resolve(this.getMockAnalysis());
          }
        }
      });
    });
  }

  /**
   * Normalize analysis result to consistent format
   */
  normalizeAnalysisResult(data) {
    return {
      // Mood features (0-1 scale)
      energy: data.energy || 0.5,
      valence: data.valence || 0.5,
      arousal: data.arousal || 0.5,
      danceability: data.danceability || 0.5,

      // Musical features
      bpm: data.bpm || data.tempo || 120,
      key: data.key || 'unknown',
      mode: data.mode || 'major',

      // Semantic tags
      moodTags: data.moods || data.mood_tags || [],
      genreHints: data.genres || data.genre_hints || [],

      // Advanced features (if available)
      timbre: data.timbre,
      rhythm: data.rhythm,
      harmony: data.harmony,

      // Confidence scores
      confidence: data.confidence || 0.7
    };
  }

  /**
   * Mock analysis for development/testing
   */
  getMockAnalysis() {
    return {
      energy: 0.75,
      valence: 0.6,
      arousal: 0.7,
      danceability: 0.8,
      bpm: 128,
      key: 'A minor',
      mode: 'minor',
      moodTags: ['energetic', 'dark', 'driving'],
      genreHints: ['techno', 'house'],
      confidence: 0.65
    };
  }

  /**
   * Analyze multiple audio files in batch
   */
  async analyzeBatch(audioFilePaths) {
    const results = await Promise.all(
      audioFilePaths.map(filePath => this.analyzeMood(filePath))
    );

    return results;
  }

  /**
   * Generate audio DNA profile from multiple tracks
   * Aggregates features to create overall taste profile
   */
  async generateAudioDNA(analyses) {
    if (!analyses || analyses.length === 0) {
      return {
        profile: 'No audio data available',
        features: {},
        confidence: 0
      };
    }

    // Calculate averages
    const avgEnergy = analyses.reduce((sum, a) => sum + a.energy, 0) / analyses.length;
    const avgValence = analyses.reduce((sum, a) => sum + a.valence, 0) / analyses.length;
    const avgBpm = analyses.reduce((sum, a) => sum + a.bpm, 0) / analyses.length;

    // Collect all mood tags
    const allMoodTags = analyses.flatMap(a => a.moodTags);
    const moodFrequency = {};
    allMoodTags.forEach(tag => {
      moodFrequency[tag] = (moodFrequency[tag] || 0) + 1;
    });

    const dominantMoods = Object.entries(moodFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mood]) => mood);

    // Collect genre hints
    const allGenres = analyses.flatMap(a => a.genreHints);
    const genreFrequency = {};
    allGenres.forEach(genre => {
      genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
    });

    const dominantGenres = Object.entries(genreFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Determine energy category
    const energyCategory = avgEnergy > 0.7 ? 'high-energy' :
                          avgEnergy > 0.4 ? 'moderate' : 'chill';

    // Determine mood category
    const moodCategory = avgValence > 0.6 ? 'positive' :
                        avgValence > 0.4 ? 'neutral' : 'dark';

    // Generate profile description
    const profile = this.generateAudioProfileDescription(
      energyCategory,
      moodCategory,
      Math.round(avgBpm),
      dominantMoods,
      dominantGenres
    );

    return {
      profile,
      features: {
        avgEnergy: Math.round(avgEnergy * 100) / 100,
        avgValence: Math.round(avgValence * 100) / 100,
        avgBpm: Math.round(avgBpm),
        energyCategory,
        moodCategory,
        dominantMoods,
        dominantGenres
      },
      trackCount: analyses.length,
      confidence: Math.min(analyses.length / 5, 1) // Higher with more tracks
    };
  }

  /**
   * Generate natural language audio profile description
   */
  generateAudioProfileDescription(energy, mood, bpm, moods, genres) {
    const genreText = genres.length > 0 ? genres.join('/') : 'eclectic';
    const moodText = moods.slice(0, 2).join(' and ');

    return `${energy} ${genreText} with ${moodText} vibes around ${bpm} BPM`;
  }

  /**
   * Separate audio into stems (vocals, drums, bass, other)
   * Uses SINK's Spleeter integration
   */
  async separateStems(audioFilePath) {
    try {
      const response = await axios.post(`${this.sinkBaseUrl}/api/audio/separate`, {
        file_path: audioFilePath,
        stems: 4 // 4-stem separation
      });

      return {
        success: true,
        stems: response.data.stems
      };
    } catch (error) {
      console.error('Stem separation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SinkService();
