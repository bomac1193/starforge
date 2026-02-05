const Database = require('better-sqlite3');
const path = require('path');
const libraryService = require('./libraryService');
const influenceGenealogy = require('./influenceGenealogy');

/**
 * Catalog Analysis Service
 * Performs aggregate analysis across all user tracks
 * Intelligent caching with hash-based invalidation
 */
class CatalogAnalysisService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../starforge_audio.db');
    this.db = null;
  }

  getDb() {
    if (!this.db) {
      this.db = new Database(this.dbPath);
    }
    return this.db;
  }

  /**
   * Get catalog analysis with intelligent caching
   */
  async getCatalogAnalysis(userId, forceRefresh = false, mode = 'hybrid', granularity = 'detailed') {
    const db = this.getDb();
    const currentHash = libraryService.calculateTrackHash(userId);

    // Check cache (mode + granularity specific)
    if (!forceRefresh) {
      const cached = db.prepare('SELECT * FROM catalog_cache WHERE user_id = ? AND mode = ? AND granularity = ?').get(userId, mode, granularity);

      if (cached && cached.track_hash === currentHash) {
        // Cache is valid
        return {
          fromCache: true,
          lastAnalysis: cached.last_analysis,
          mode: mode,
          granularity: granularity,
          ...this.parseCachedData(cached)
        };
      }
    }

    // Compute fresh analysis
    const analysis = await this.computeCatalogAnalysis(userId, mode, granularity);

    // Save to cache
    this.saveCatalogCache(userId, analysis, currentHash, mode, granularity);

    // Save snapshot to history
    this.saveAnalysisSnapshot(userId, analysis);

    return {
      fromCache: false,
      lastAnalysis: new Date().toISOString(),
      ...analysis
    };
  }

  /**
   * Compute fresh catalog analysis
   */
  async computeCatalogAnalysis(userId, mode = 'hybrid', granularity = 'detailed') {
    const db = this.getDb();

    // Get tracks filtered by mode
    let query = 'SELECT * FROM audio_tracks WHERE user_id = ?';
    const params = [userId];

    if (mode === 'dj') {
      query += ' AND source LIKE ?';
      params.push('%rekordbox%');
    } else if (mode === 'original') {
      query += ' AND source = ?';
      params.push('upload');
    }

    const tracks = db.prepare(query).all(...params);

    if (tracks.length === 0) {
      return {
        available: false,
        message: 'No tracks in library. Upload tracks to see catalog analysis.'
      };
    }

    // Calculate aggregate stats
    const aggregateStats = this.calculateAggregateStats(tracks);

    // Calculate taste coherence
    const tasteCoherence = this.calculateTasteCoherence(tracks);

    // Calculate genre distribution (with granularity control)
    const genreDistribution = this.calculateGenreDistribution(tracks, granularity);

    // Get BPM/Energy curves
    const distributions = this.calculateDistributions(tracks);

    // Get temporal evolution (if tracks have dates)
    const evolution = this.calculateTemporalEvolution(tracks);

    // Get influence genealogy (if user has Elite tier)
    let influenceGenealogyData = null;
    try {
      influenceGenealogyData = await influenceGenealogy.analyzeInfluenceGenealogy(userId);
    } catch (error) {
      console.log('Influence genealogy not available:', error.message);
    }

    // Get context comparison (DJ vs Personal if available)
    const contextComparison = this.analyzeContext(tracks);

    return {
      available: true,
      mode: mode,
      granularity: granularity,
      trackCount: tracks.length,
      aggregateStats,
      tasteCoherence,
      genreDistribution,
      distributions,
      evolution,
      influenceGenealogy: influenceGenealogyData,
      contextComparison,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate preference weight for each track
   * Combines play count (60%) + star rating (40%)
   * Returns normalized weights (0-1 scale)
   */
  calculatePreferenceWeights(tracks) {
    // Get max values for normalization
    const maxPlayCount = Math.max(...tracks.map(t => t.rekordbox_play_count || t.play_count || 0), 1);
    const maxRating = 255; // Rekordbox stores ratings as 0-255

    return tracks.map(track => {
      const playCount = track.rekordbox_play_count || track.play_count || 0;
      const rating = track.rekordbox_star_rating || track.star_rating || 0;

      // Normalize to 0-1
      const normalizedPlayCount = playCount / maxPlayCount;
      const normalizedRating = rating / maxRating;

      // Weighted combination: 60% play count (revealed), 40% rating (conscious)
      const weight = (normalizedPlayCount * 0.6) + (normalizedRating * 0.4);

      // If no preference data, use minimum weight (not zero, to include in analysis)
      return weight > 0 ? weight : 0.1;
    });
  }

  /**
   * Calculate weighted average
   */
  weightedAverage(values, weights) {
    if (values.length === 0 || values.length !== weights.length) return 0;
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
  }

  /**
   * Calculate aggregate statistics (PREFERENCE WEIGHTED)
   */
  calculateAggregateStats(tracks) {
    // Calculate preference weights
    const weights = this.calculatePreferenceWeights(tracks);

    // Filter tracks with valid data and get corresponding weights
    const tracksWithBpm = [];
    const bpmWeights = [];
    tracks.forEach((t, i) => {
      if (t.bpm && t.bpm > 0) {
        tracksWithBpm.push(t.bpm);
        bpmWeights.push(weights[i]);
      }
    });

    const tracksWithEnergy = [];
    const energyWeights = [];
    tracks.forEach((t, i) => {
      if (t.energy !== null && t.energy !== undefined) {
        tracksWithEnergy.push(t.energy);
        energyWeights.push(weights[i]);
      }
    });

    const tracksWithValence = [];
    const valenceWeights = [];
    tracks.forEach((t, i) => {
      if (t.valence !== null && t.valence !== undefined) {
        tracksWithValence.push(t.valence);
        valenceWeights.push(weights[i]);
      }
    });

    return {
      // Weighted averages (what you ACTUALLY like)
      avgBpm: this.weightedAverage(tracksWithBpm, bpmWeights),
      minBpm: tracksWithBpm.length > 0 ? Math.min(...tracksWithBpm) : 0,
      maxBpm: tracksWithBpm.length > 0 ? Math.max(...tracksWithBpm) : 0,
      bpmRange: tracksWithBpm.length > 0 ? Math.max(...tracksWithBpm) - Math.min(...tracksWithBpm) : 0,

      avgEnergy: this.weightedAverage(tracksWithEnergy, energyWeights),
      minEnergy: tracksWithEnergy.length > 0 ? Math.min(...tracksWithEnergy) : 0,
      maxEnergy: tracksWithEnergy.length > 0 ? Math.max(...tracksWithEnergy) : 0,

      avgValence: this.weightedAverage(tracksWithValence, valenceWeights),

      totalDuration: tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0),
      avgDuration: tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / tracks.length,

      totalPlayCount: tracks.reduce((sum, t) => sum + (t.rekordbox_play_count || t.play_count || 0), 0),
      avgPlayCount: tracks.reduce((sum, t) => sum + (t.rekordbox_play_count || t.play_count || 0), 0) / tracks.length
    };
  }

  /**
   * Calculate taste coherence (consistency metrics)
   */
  calculateTasteCoherence(tracks) {
    const bpms = tracks.map(t => t.bpm).filter(b => b && b > 0);
    const energies = tracks.map(t => t.energy).filter(e => e !== null && e !== undefined);
    const keys = tracks.map(t => t.key).filter(k => k);

    // BPM consistency (lower variance = more consistent)
    const bpmMean = bpms.reduce((a, b) => a + b, 0) / bpms.length;
    const bpmVariance = bpms.reduce((sum, b) => sum + Math.pow(b - bpmMean, 2), 0) / bpms.length;
    const bpmStdDev = Math.sqrt(bpmVariance);
    const bpmConsistency = Math.max(0, 1 - (bpmStdDev / bpmMean)); // Normalized

    // Energy consistency
    const energyMean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const energyVariance = energies.reduce((sum, e) => sum + Math.pow(e - energyMean, 2), 0) / energies.length;
    const energyStdDev = Math.sqrt(energyVariance);
    const energyConsistency = 1 - energyStdDev; // Already 0-1 scale

    // Key diversity (Shannon entropy)
    const keyCounts = {};
    keys.forEach(k => keyCounts[k] = (keyCounts[k] || 0) + 1);
    const keyEntropy = Object.values(keyCounts).reduce((sum, count) => {
      const p = count / keys.length;
      return sum - (p * Math.log2(p));
    }, 0);
    const maxEntropy = Math.log2(Object.keys(keyCounts).length || 1);
    const keyCoherence = 1 - (keyEntropy / maxEntropy); // Inverse: high entropy = low coherence

    // Overall coherence
    const overallCoherence = (bpmConsistency + energyConsistency + keyCoherence) / 3;

    return {
      overall: parseFloat(overallCoherence.toFixed(2)),
      bpmConsistency: parseFloat(bpmConsistency.toFixed(2)),
      energyConsistency: parseFloat(energyConsistency.toFixed(2)),
      keyCoherence: parseFloat(keyCoherence.toFixed(2)),
      interpretation: this.interpretCoherence(overallCoherence)
    };
  }

  interpretCoherence(score) {
    if (score > 0.8) return 'Highly focused taste - very consistent sonic signature';
    if (score > 0.6) return 'Coherent taste - recognizable style with some variety';
    if (score > 0.4) return 'Diverse taste - eclectic mix with common threads';
    return 'Highly diverse taste - wide-ranging musical exploration';
  }

  /**
   * Calculate genre distribution using nuanced genre taxonomy
   * @param {Array} tracks - Array of track objects
   * @param {String} granularity - 'simplified' or 'detailed'
   */
  calculateGenreDistribution(tracks, granularity = 'detailed') {
    // Use the same clustering logic as Influence Genealogy
    const clusters = influenceGenealogy.clusterTracksByGenre(tracks);

    // If detailed view, return as is
    if (granularity === 'detailed') {
      return clusters.map(cluster => ({
        genre: cluster.genre.name,
        culturalContext: cluster.genre.cultural_context,
        count: cluster.trackCount,
        percentage: cluster.percentage,
        avgBpm: cluster.avgBpm,
        avgEnergy: cluster.avgEnergy
      }));
    }

    // If simplified view, group subgenres by parent
    return this.groupGenresByParent(clusters);
  }

  /**
   * Group child genres under their parent genres for simplified view
   * @param {Array} clusters - Genre clusters from Influence Genealogy
   */
  groupGenresByParent(clusters) {
    const genreTaxonomy = require('./genreTaxonomy');
    const parentGroups = {};

    clusters.forEach(cluster => {
      const genre = cluster.genre;

      // If genre has a parent, group under parent
      if (genre.parent_id) {
        const parent = genreTaxonomy.getGenre(genre.parent_id);
        const parentName = parent ? parent.name : 'Other';

        if (!parentGroups[parentName]) {
          parentGroups[parentName] = {
            genre: parentName,
            culturalContext: parent ? parent.cultural_context : null,
            count: 0,
            percentage: 0,
            bpms: [],
            energies: [],
            subgenres: []
          };
        }

        parentGroups[parentName].count += cluster.trackCount;
        parentGroups[parentName].percentage += cluster.percentage;
        parentGroups[parentName].subgenres.push(cluster.genre.name);

        // Collect BPMs and energies for averaging
        if (cluster.avgBpm) {
          parentGroups[parentName].bpms.push(cluster.avgBpm);
        }
        if (cluster.avgEnergy) {
          parentGroups[parentName].energies.push(cluster.avgEnergy);
        }
      } else {
        // Root genre - keep as is
        const rootName = genre.name;

        if (!parentGroups[rootName]) {
          parentGroups[rootName] = {
            genre: rootName,
            culturalContext: genre.cultural_context,
            count: cluster.trackCount,
            percentage: cluster.percentage,
            bpms: cluster.avgBpm ? [cluster.avgBpm] : [],
            energies: cluster.avgEnergy ? [cluster.avgEnergy] : [],
            subgenres: []
          };
        }
      }
    });

    // Calculate averages and format output
    return Object.values(parentGroups)
      .map(group => ({
        genre: group.genre,
        culturalContext: group.culturalContext,
        count: group.count,
        percentage: parseFloat(group.percentage.toFixed(1)),
        avgBpm: group.bpms.length > 0
          ? group.bpms.reduce((a, b) => a + b, 0) / group.bpms.length
          : null,
        avgEnergy: group.energies.length > 0
          ? group.energies.reduce((a, b) => a + b, 0) / group.energies.length
          : null,
        subgenres: group.subgenres.length > 0 ? group.subgenres : undefined
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate BPM and Energy distributions
   */
  calculateDistributions(tracks) {
    const bpms = tracks.map(t => t.bpm).filter(b => b && b > 0).sort((a, b) => a - b);
    const energies = tracks.map(t => t.energy).filter(e => e !== null).sort((a, b) => a - b);

    return {
      bpm: {
        values: bpms,
        histogram: this.createHistogram(bpms, 10),
        percentiles: {
          p25: this.percentile(bpms, 0.25),
          p50: this.percentile(bpms, 0.50),
          p75: this.percentile(bpms, 0.75)
        }
      },
      energy: {
        values: energies,
        histogram: this.createHistogram(energies, 10),
        percentiles: {
          p25: this.percentile(energies, 0.25),
          p50: this.percentile(energies, 0.50),
          p75: this.percentile(energies, 0.75)
        }
      }
    };
  }

  createHistogram(values, bins) {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    const histogram = Array(bins).fill(0);

    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    return histogram.map((count, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count
    }));
  }

  percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }

  /**
   * Calculate temporal evolution
   */
  calculateTemporalEvolution(tracks) {
    const tracksWithDates = tracks
      .filter(t => t.uploaded_at)
      .sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));

    if (tracksWithDates.length < 2) {
      return { available: false };
    }

    // Group by month
    const monthlyStats = {};
    tracksWithDates.forEach(track => {
      const month = new Date(track.uploaded_at).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { tracks: [], month };
      }
      monthlyStats[month].tracks.push(track);
    });

    // Calculate stats per month
    const evolution = Object.values(monthlyStats).map(group => {
      const bpms = group.tracks.map(t => t.bpm).filter(b => b);
      const energies = group.tracks.map(t => t.energy).filter(e => e !== null);

      return {
        month: group.month,
        trackCount: group.tracks.length,
        avgBpm: bpms.length > 0 ? bpms.reduce((a, b) => a + b, 0) / bpms.length : null,
        avgEnergy: energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : null
      };
    });

    return {
      available: true,
      timeline: evolution,
      trends: this.detectTrends(evolution)
    };
  }

  detectTrends(evolution) {
    if (evolution.length < 3) return { available: false };

    const bpms = evolution.map(e => e.avgBpm).filter(b => b);
    const energies = evolution.map(e => e.avgEnergy).filter(e => e);

    return {
      bpmTrend: bpms.length > 0 ? (bpms[bpms.length - 1] - bpms[0] > 5 ? 'increasing' : bpms[0] - bpms[bpms.length - 1] > 5 ? 'decreasing' : 'stable') : null,
      energyTrend: energies.length > 0 ? (energies[energies.length - 1] - energies[0] > 0.1 ? 'increasing' : energies[0] - energies[energies.length - 1] > 0.1 ? 'decreasing' : 'stable') : null
    };
  }

  /**
   * Analyze context (DJ vs Personal music)
   */
  analyzeContext(tracks) {
    const djTracks = tracks.filter(t => t.source === 'rekordbox' || t.source === 'serato');
    const personalTracks = tracks.filter(t => t.source === 'upload');

    if (djTracks.length === 0 || personalTracks.length === 0) {
      return { available: false };
    }

    const djStats = this.calculateAggregateStats(djTracks);
    const personalStats = this.calculateAggregateStats(personalTracks);

    return {
      available: true,
      dj: {
        count: djTracks.length,
        avgBpm: djStats.avgBpm,
        avgEnergy: djStats.avgEnergy
      },
      personal: {
        count: personalTracks.length,
        avgBpm: personalStats.avgBpm,
        avgEnergy: personalStats.avgEnergy
      },
      divergence: {
        bpm: Math.abs(djStats.avgBpm - personalStats.avgBpm),
        energy: Math.abs(djStats.avgEnergy - personalStats.avgEnergy)
      }
    };
  }

  /**
   * Save catalog cache
   */
  saveCatalogCache(userId, analysis, trackHash, mode = 'hybrid', granularity = 'detailed') {
    const db = this.getDb();

    // First ensure the table has mode and granularity columns
    try {
      db.prepare(`ALTER TABLE catalog_cache ADD COLUMN mode TEXT DEFAULT 'hybrid'`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      db.prepare(`ALTER TABLE catalog_cache ADD COLUMN granularity TEXT DEFAULT 'detailed'`).run();
    } catch (e) {
      // Column already exists
    }

    db.prepare(`
      INSERT OR REPLACE INTO catalog_cache (
        user_id, mode, granularity, track_count, track_hash,
        avg_bpm, avg_energy, avg_valence, bpm_std_dev, energy_std_dev,
        genre_distribution, taste_coherence, influence_genealogy,
        last_analysis, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      mode,
      granularity,
      analysis.trackCount || 0,
      trackHash,
      analysis.aggregateStats?.avgBpm || null,
      analysis.aggregateStats?.avgEnergy || null,
      analysis.aggregateStats?.avgValence || null,
      null, // bpm_std_dev
      null, // energy_std_dev
      JSON.stringify(analysis.genreDistribution || []),
      JSON.stringify(analysis.tasteCoherence || {}),
      JSON.stringify(analysis.influenceGenealogy || {}),
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Save analysis snapshot for history
   */
  saveAnalysisSnapshot(userId, analysis) {
    const db = this.getDb();

    const topGenre = analysis.genreDistribution && analysis.genreDistribution[0]
      ? analysis.genreDistribution[0].genre
      : null;

    db.prepare(`
      INSERT INTO analysis_history (
        user_id, track_count, avg_bpm, avg_energy, top_genre, snapshot_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      analysis.trackCount || 0,
      analysis.aggregateStats?.avgBpm || null,
      analysis.aggregateStats?.avgEnergy || null,
      topGenre,
      new Date().toISOString()
    );
  }

  /**
   * Parse cached data
   */
  parseCachedData(cached) {
    return {
      available: true,
      trackCount: cached.track_count,
      aggregateStats: {
        avgBpm: cached.avg_bpm,
        avgEnergy: cached.avg_energy,
        avgValence: cached.avg_valence
      },
      genreDistribution: JSON.parse(cached.genre_distribution || '[]'),
      tasteCoherence: JSON.parse(cached.taste_coherence || '{}'),
      influenceGenealogy: JSON.parse(cached.influence_genealogy || '{}')
    };
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(userId, limit = 12) {
    const db = this.getDb();
    return db.prepare(`
      SELECT * FROM analysis_history
      WHERE user_id = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `).all(userId, limit);
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new CatalogAnalysisService();
