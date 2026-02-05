const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const xml2js = require('xml2js');

/**
 * Enhanced SINK service with:
 * - Quality scoring
 * - Highlight detection
 * - Audio embeddings
 * - Best version finder
 */
class SinkEnhancedService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../python/audio_analyzer.py');
  }

  /**
   * Analyze audio file with quality scoring
   */
  async analyzeWithQuality(audioPath) {
    try {
      const analysis = await this.runPythonAnalysis(audioPath, { includeQuality: true });

      return {
        // Basic features
        bpm: analysis.bpm,
        effectiveBpm: analysis.effective_bpm || analysis.bpm,
        isHalftime: analysis.is_halftime || false,
        key: analysis.key,
        energy: analysis.energy,
        valence: analysis.valence,
        loudness: analysis.loudness,
        duration: analysis.duration,

        // Quality score
        qualityScore: analysis.quality_score,
        qualityBreakdown: analysis.quality_breakdown,

        // Advanced features
        spectralCentroid: analysis.spectral_centroid,
        spectralRolloff: analysis.spectral_rolloff,
        zeroCrossingRate: analysis.zero_crossing_rate,
        silenceRatio: analysis.silence_ratio,
        tempoConfidence: analysis.tempo_confidence,

        // Mood tags
        moodTags: this.generateMoodTags(analysis)
      };
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect highlights/best moments in a track
   */
  async detectHighlights(audioPath, numHighlights = 3) {
    try {
      const result = await this.runPythonAnalysis(audioPath, {
        detectHighlights: true,
        numHighlights
      });

      if (!result || !result.highlights) {
        return [];
      }

      return result.highlights.map(h => ({
        startSeconds: h.start,
        endSeconds: h.end,
        score: h.score,
        reason: h.reason, // 'energy_peak', 'novelty_peak', 'spectral_interest'
        peakFeature: h.peak_feature
      }));
    } catch (error) {
      console.error('Highlight detection failed:', error);
      return [];
    }
  }

  /**
   * Calculate quality score from analysis
   */
  calculateQualityScore(analysis) {
    const scores = {};

    // 1. Duration score (penalize very short clips)
    const duration = analysis.duration || 0;
    if (duration < 10) {
      scores.duration = 0.3;
    } else if (duration < 30) {
      scores.duration = 0.6;
    } else if (duration < 60) {
      scores.duration = 0.8;
    } else {
      scores.duration = 1.0;
    }

    // 2. Loudness score (penalize very quiet tracks)
    const loudness = analysis.loudness || -30;
    if (loudness < -30) {
      scores.loudness = 0.4;
    } else if (loudness < -20) {
      scores.loudness = 0.7;
    } else {
      scores.loudness = 1.0;
    }

    // 3. Silence ratio score (penalize excessive silence)
    const silenceRatio = analysis.silence_ratio || 0;
    scores.silence = Math.max(0, 1.0 - silenceRatio);

    // 4. Tempo confidence (reward clear rhythm)
    const tempoConf = analysis.tempo_confidence || 0.5;
    scores.tempo = tempoConf;

    // Weighted average
    const overall = (
      scores.duration * 0.25 +
      scores.loudness * 0.25 +
      scores.silence * 0.25 +
      scores.tempo * 0.25
    );

    return {
      overall: Math.round(overall * 100) / 100,
      breakdown: scores
    };
  }

  /**
   * Find best version among similar tracks
   */
  async findBestVersion(trackAnalyses, options = {}) {
    const {
      similarityWeight = 0.5,
      ratingWeight = 0.3,
      qualityWeight = 0.2
    } = options;

    // Calculate composite scores
    const scored = trackAnalyses.map(track => {
      const similarityScore = track.similarity || 0;
      const ratingScore = this.normalizeRating(track.rating);
      const qualityScore = track.qualityScore || 0.5;

      const compositeScore = (
        similarityScore * similarityWeight +
        ratingScore * ratingWeight +
        qualityScore * qualityWeight
      );

      return {
        ...track,
        compositeScore,
        scoreBreakdown: {
          similarity: similarityScore,
          rating: ratingScore,
          quality: qualityScore
        }
      };
    });

    // Sort by composite score
    return scored.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Normalize rating to 0-1 scale
   */
  normalizeRating(rating) {
    if (typeof rating === 'number') {
      // Star rating (0-5) or thumbs (-1 to +1)
      if (rating >= -1 && rating <= 1) {
        // Thumbs: -1, 0, +1 -> 0, 0.5, 1
        return (rating + 1) / 2;
      } else {
        // Stars: 0-5 -> 0-1
        return rating / 5;
      }
    }
    return 0.5; // No rating
  }

  /**
   * Parse Rekordbox collection.xml
   */
  async parseRekordboxXML(xmlPath) {
    try {
      const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      const tracks = [];
      const trackElements = result.DJ_PLAYLISTS?.COLLECTION?.[0]?.TRACK || [];

      for (const trackElem of trackElements) {
        const attrs = trackElem.$;

        // Parse file location (Rekordbox uses file://localhost/ prefix)
        let filePath = attrs.Location || '';
        filePath = filePath.replace('file://localhost/', '/');
        filePath = decodeURIComponent(filePath);

        tracks.push({
          rekordboxId: attrs.TrackID,
          title: attrs.Name,
          artist: attrs.Artist,
          album: attrs.Album,
          genre: attrs.Genre,

          // Musical features
          bpm: parseFloat(attrs.AverageBpm || 0),
          key: attrs.Tonality,
          durationSeconds: parseInt(attrs.TotalTime || 0),

          // User data
          starRating: parseInt(attrs.Rating || 0),
          playCount: parseInt(attrs.PlayCount || 0),
          color: attrs.Colour,
          comments: attrs.Comments,

          // File info
          filePath,
          fileSize: parseInt(attrs.Size || 0),
          bitrate: parseInt(attrs.Bitrate || 0),

          // Dates
          dateAdded: attrs.DateAdded,
          lastPlayed: attrs.LastPlayed
        });
      }

      return {
        totalTracks: tracks.length,
        tracks,
        stats: this.calculateRekordboxStats(tracks)
      };
    } catch (error) {
      console.error('Failed to parse Rekordbox XML:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from Rekordbox library
   */
  calculateRekordboxStats(tracks) {
    // Filter to rated/played tracks
    const ratedTracks = tracks.filter(t => t.starRating > 0);
    const playedTracks = tracks.filter(t => t.playCount > 0);
    const favorites = tracks.filter(t => t.starRating >= 4 || t.playCount > 10);

    // Genre distribution
    const genreCounts = {};
    tracks.forEach(t => {
      if (t.genre) {
        genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
      }
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // BPM analysis (from favorites)
    const bpms = favorites.map(t => t.bpm).filter(b => b > 0);
    const bpmStats = bpms.length > 0 ? {
      min: Math.min(...bpms),
      max: Math.max(...bpms),
      avg: bpms.reduce((a, b) => a + b, 0) / bpms.length,
      median: this.median(bpms)
    } : null;

    // Key distribution
    const keyCounts = {};
    favorites.forEach(t => {
      if (t.key) {
        keyCounts[t.key] = (keyCounts[t.key] || 0) + 1;
      }
    });
    const topKeys = Object.entries(keyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));

    // Most played
    const mostPlayed = tracks
      .filter(t => t.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 20)
      .map(t => ({
        title: t.title,
        artist: t.artist,
        playCount: t.playCount,
        starRating: t.starRating
      }));

    // Highest rated
    const highestRated = tracks
      .filter(t => t.starRating > 0)
      .sort((a, b) => b.starRating - a.starRating)
      .slice(0, 20)
      .map(t => ({
        title: t.title,
        artist: t.artist,
        starRating: t.starRating,
        playCount: t.playCount
      }));

    return {
      totalTracks: tracks.length,
      ratedTracks: ratedTracks.length,
      playedTracks: playedTracks.length,
      favoriteTracks: favorites.length,

      topGenres,
      topKeys,
      bpmStats,

      mostPlayed,
      highestRated,

      totalPlays: tracks.reduce((sum, t) => sum + t.playCount, 0),
      avgRating: ratedTracks.length > 0
        ? ratedTracks.reduce((sum, t) => sum + t.starRating, 0) / ratedTracks.length
        : 0
    };
  }

  /**
   * Generate taste profile from Rekordbox data
   */
  generateTasteProfile(rekordboxData) {
    const { tracks, stats } = rekordboxData;
    const favorites = tracks.filter(t => t.starRating >= 4 || t.playCount > 10);

    // BPM preferences (25th-75th percentile from favorites)
    const favoriteBpms = favorites.map(t => t.bpm).filter(b => b > 0).sort((a, b) => a - b);
    const bpmRange = favoriteBpms.length > 0 ? {
      min: favoriteBpms[Math.floor(favoriteBpms.length * 0.25)],
      max: favoriteBpms[Math.floor(favoriteBpms.length * 0.75)]
    } : null;

    return {
      preferredBpmRange: bpmRange,
      topGenres: stats.topGenres.slice(0, 5),
      topKeys: stats.topKeys,

      listeningPatterns: {
        totalPlays: stats.totalPlays,
        avgRating: stats.avgRating,
        favoriteCount: favorites.length,
        mostPlayedGenres: stats.topGenres.slice(0, 3).map(g => g.genre)
      },

      preferences: {
        highEnergyPreference: this.calculateEnergyPreference(favorites),
        diversityScore: this.calculateDiversityScore(favorites)
      }
    };
  }

  /**
   * Calculate energy preference from favorites
   */
  calculateEnergyPreference(favorites) {
    // Infer energy from BPM (rough heuristic)
    const bpms = favorites.map(t => t.bpm).filter(b => b > 0);
    if (bpms.length === 0) return 0.5;

    const avgBpm = bpms.reduce((a, b) => a + b, 0) / bpms.length;

    // Normalize BPM to energy (60-180 BPM -> 0-1)
    const energy = Math.max(0, Math.min(1, (avgBpm - 60) / 120));
    return Math.round(energy * 100) / 100;
  }

  /**
   * Calculate diversity score (how varied is your taste)
   */
  calculateDiversityScore(favorites) {
    const genres = [...new Set(favorites.map(t => t.genre).filter(g => g))];
    const keys = [...new Set(favorites.map(t => t.key).filter(k => k))];

    // More genres/keys = more diverse
    const genreDiversity = Math.min(1, genres.length / 10);
    const keyDiversity = Math.min(1, keys.length / 12);

    return Math.round((genreDiversity + keyDiversity) / 2 * 100) / 100;
  }

  /**
   * Run Python audio analysis script
   */
  async runPythonAnalysis(audioPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScript,
        audioPath,
        '--json'
      ];

      if (options.includeQuality) {
        args.push('--quality');
      }

      if (options.detectHighlights) {
        args.push('--highlights');
        args.push('--num-highlights', options.numHighlights || 3);
      }

      const python = spawn('python3', args);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python analysis failed: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        }
      });
    });
  }

  /**
   * Generate mood tags from analysis
   */
  generateMoodTags(analysis) {
    const tags = [];
    const { energy, valence, bpm, loudness } = analysis;

    // Energy-based tags
    if (energy > 0.7) {
      tags.push('energetic', 'intense');
    } else if (energy < 0.3) {
      tags.push('calm', 'relaxed');
    }

    // Valence-based tags
    if (valence > 0.6) {
      tags.push('uplifting', 'bright', 'positive');
    } else if (valence < 0.4) {
      tags.push('dark', 'moody', 'melancholic');
    }

    // BPM-based tags
    if (bpm > 140) {
      tags.push('fast', 'driving');
    } else if (bpm < 90) {
      tags.push('slow', 'downtempo');
    }

    // Loudness-based tags
    if (loudness > -10) {
      tags.push('loud', 'powerful');
    } else if (loudness < -20) {
      tags.push('quiet', 'subtle');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate taste coherence score
   * Measures how cohesive/consistent the user's music taste is
   */
  calculateTasteCoherence(tracks) {
    if (!tracks || tracks.length < 2) {
      return {
        overall: 0,
        bpmConsistency: 0,
        energyConsistency: 0,
        genreCoherence: 0,
        keyCoherence: 0,
        moodCoherence: 0
      };
    }

    // Extract values
    const bpms = tracks.map(t => t.bpm).filter(b => b > 0);
    const energies = tracks.map(t => t.energy || t.analysis?.energy).filter(e => e !== undefined);
    const genres = tracks.map(t => t.genre).filter(g => g);
    const keys = tracks.map(t => t.key || t.analysis?.key).filter(k => k);
    const valences = tracks.map(t => t.valence || t.analysis?.valence).filter(v => v !== undefined);

    // 1. BPM Consistency (lower coefficient of variation = more consistent)
    const bpmConsistency = bpms.length > 1
      ? this.calculateConsistencyScore(bpms)
      : 0.5;

    // 2. Energy Consistency
    const energyConsistency = energies.length > 1
      ? this.calculateConsistencyScore(energies)
      : 0.5;

    // 3. Genre Coherence (Shannon entropy - lower = more focused)
    const genreCoherence = genres.length > 1
      ? this.calculateGenreCoherence(genres)
      : 0.5;

    // 4. Key Coherence (variety of keys used)
    const keyCoherence = keys.length > 1
      ? this.calculateKeyCoherence(keys)
      : 0.5;

    // 5. Mood Coherence (valence consistency)
    const moodCoherence = valences.length > 1
      ? this.calculateConsistencyScore(valences)
      : 0.5;

    // Overall coherence (weighted average)
    const overall = (
      bpmConsistency * 0.25 +
      energyConsistency * 0.25 +
      genreCoherence * 0.20 +
      keyCoherence * 0.15 +
      moodCoherence * 0.15
    );

    return {
      overall: Math.round(overall * 100) / 100,
      bpmConsistency: Math.round(bpmConsistency * 100) / 100,
      energyConsistency: Math.round(energyConsistency * 100) / 100,
      genreCoherence: Math.round(genreCoherence * 100) / 100,
      keyCoherence: Math.round(keyCoherence * 100) / 100,
      moodCoherence: Math.round(moodCoherence * 100) / 100
    };
  }

  /**
   * Calculate consistency score from numeric array
   * Uses coefficient of variation (lower = more consistent)
   * Returns 0-1 score (1 = very consistent, 0 = very diverse)
   */
  calculateConsistencyScore(values) {
    if (values.length < 2) return 0.5;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV)
    const cv = mean !== 0 ? stdDev / mean : 0;

    // Convert CV to 0-1 score (lower CV = higher consistency)
    // CV of 0 = perfect consistency (1.0), CV of 1+ = very diverse (0.0)
    const consistency = Math.max(0, Math.min(1, 1 - cv));

    return consistency;
  }

  /**
   * Calculate genre coherence using Shannon entropy
   * Lower entropy = more focused genre taste
   */
  calculateGenreCoherence(genres) {
    if (genres.length < 2) return 0.5;

    // Count genre frequencies
    const genreCounts = {};
    genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    const total = genres.length;
    const uniqueGenres = Object.keys(genreCounts).length;

    // Shannon entropy
    let entropy = 0;
    for (const genre in genreCounts) {
      const p = genreCounts[genre] / total;
      entropy -= p * Math.log2(p);
    }

    // Maximum possible entropy (all genres equally distributed)
    const maxEntropy = Math.log2(uniqueGenres);

    // Normalize to 0-1 (1 = very focused, 0 = very diverse)
    const coherence = maxEntropy > 0 ? 1 - (entropy / maxEntropy) : 0.5;

    return coherence;
  }

  /**
   * Calculate key coherence
   * Measures how varied the musical keys are
   */
  calculateKeyCoherence(keys) {
    if (keys.length < 2) return 0.5;

    const uniqueKeys = new Set(keys).size;
    const maxKeys = 24; // 12 major + 12 minor

    // Fewer unique keys = higher coherence
    const coherence = 1 - (uniqueKeys / maxKeys);

    return Math.max(0, Math.min(1, coherence));
  }

  /**
   * Helper: Calculate median
   */
  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

module.exports = new SinkEnhancedService();
