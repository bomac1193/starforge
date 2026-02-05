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
  async getCatalogAnalysis(userId, forceRefresh = false) {
    const db = this.getDb();
    const currentHash = libraryService.calculateTrackHash(userId);

    // Check cache
    if (!forceRefresh) {
      const cached = db.prepare('SELECT * FROM catalog_cache WHERE user_id = ?').get(userId);

      if (cached && cached.track_hash === currentHash) {
        // Cache is valid
        return {
          fromCache: true,
          lastAnalysis: cached.last_analysis,
          ...this.parseCachedData(cached)
        };
      }
    }

    // Compute fresh analysis
    const analysis = await this.computeCatalogAnalysis(userId);

    // Save to cache
    this.saveCatalogCache(userId, analysis, currentHash);

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
  async computeCatalogAnalysis(userId) {
    const db = this.getDb();

    // Get all tracks
    const tracks = db.prepare('SELECT * FROM audio_tracks WHERE user_id = ?').all(userId);

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

    // Calculate genre distribution
    const genreDistribution = this.calculateGenreDistribution(tracks);

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
   * Calculate aggregate statistics
   */
  calculateAggregateStats(tracks) {
    const bpms = tracks.map(t => t.bpm).filter(b => b && b > 0);
    const energies = tracks.map(t => t.energy).filter(e => e !== null && e !== undefined);
    const valences = tracks.map(t => t.valence).filter(v => v !== null && v !== undefined);

    return {
      avgBpm: bpms.length > 0 ? bpms.reduce((a, b) => a + b, 0) / bpms.length : 0,
      minBpm: bpms.length > 0 ? Math.min(...bpms) : 0,
      maxBpm: bpms.length > 0 ? Math.max(...bpms) : 0,
      bpmRange: bpms.length > 0 ? Math.max(...bpms) - Math.min(...bpms) : 0,

      avgEnergy: energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0,
      minEnergy: energies.length > 0 ? Math.min(...energies) : 0,
      maxEnergy: energies.length > 0 ? Math.max(...energies) : 0,

      avgValence: valences.length > 0 ? valences.reduce((a, b) => a + b, 0) / valences.length : 0,

      totalDuration: tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0),
      avgDuration: tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / tracks.length,

      totalPlayCount: tracks.reduce((sum, t) => sum + (t.play_count || 0), 0),
      avgPlayCount: tracks.reduce((sum, t) => sum + (t.play_count || 0), 0) / tracks.length
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
   * Calculate genre distribution
   */
  calculateGenreDistribution(tracks) {
    // This would use genre tags if we had them
    // For now, cluster by BPM/energy ranges as proxy for genre
    const clusters = {
      'Ambient/Downtempo': tracks.filter(t => t.bpm < 100).length,
      'House': tracks.filter(t => t.bpm >= 115 && t.bpm < 130).length,
      'Techno': tracks.filter(t => t.bpm >= 120 && t.bpm < 150 && t.energy > 0.6).length,
      'Drum & Bass': tracks.filter(t => t.bpm >= 160).length,
      'Other': tracks.filter(t => !t.bpm || (t.bpm >= 100 && t.bpm < 115) || (t.bpm >= 130 && t.bpm < 160)).length
    };

    const total = Object.values(clusters).reduce((a, b) => a + b, 0);

    return Object.entries(clusters)
      .filter(([_, count]) => count > 0)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: parseFloat(((count / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);
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
  saveCatalogCache(userId, analysis, trackHash) {
    const db = this.getDb();

    db.prepare(`
      INSERT OR REPLACE INTO catalog_cache (
        user_id, track_count, track_hash,
        avg_bpm, avg_energy, avg_valence, bpm_std_dev, energy_std_dev,
        genre_distribution, taste_coherence, influence_genealogy,
        last_analysis, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
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
