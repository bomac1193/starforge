const Database = require('better-sqlite3');
const path = require('path');
// const sonicPaletteService = require('./sonicPaletteService'); // TODO: Implement in Phase 1
const sinkEnhanced = require('./sinkEnhanced');

/**
 * Context Comparison Service
 * Compares musical contexts (DJ collection vs personal music)
 * UNIQUE FEATURE: Multi-dimensional taste analysis for multi-hyphenate creators
 */
class ContextComparisonService {
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
   * Compare DJ collection context vs personal music context
   * Returns alignment scores and insights
   */
  async compareContexts(userId) {
    try {
      const db = this.getDb();

      // Get tracks from each context
      const djTracks = db.prepare('SELECT * FROM audio_tracks WHERE musical_context = ?').all('dj_collection');
      const myMusicTracks = db.prepare('SELECT * FROM audio_tracks WHERE musical_context = ?').all('my_music');

      if (djTracks.length === 0 && myMusicTracks.length === 0) {
        return {
          available: false,
          message: 'No tracks in either context yet'
        };
      }

      if (djTracks.length === 0) {
        return {
          available: false,
          message: 'No DJ collection tracks yet. Import Rekordbox XML to analyze DJ taste.'
        };
      }

      if (myMusicTracks.length === 0) {
        return {
          available: false,
          message: 'No personal music tracks yet. Upload your productions to analyze.'
        };
      }

      // Extract sonic palettes for each context (TODO: implement sonicPaletteService)
      // const djSonicPalette = await sonicPaletteService.extractSonicPalette(userId + '_dj', djTracks);
      // const myMusicSonicPalette = await sonicPaletteService.extractSonicPalette(userId + '_mymusic', myMusicTracks);
      const djSonicPalette = null;
      const myMusicSonicPalette = null;

      // Calculate taste coherence for each context (TODO: implement in sinkEnhanced)
      // const djCoherence = sinkEnhanced.calculateTasteCoherence(djTracks);
      // const myMusicCoherence = sinkEnhanced.calculateTasteCoherence(myMusicTracks);
      const djCoherence = { overall: 0.75 }; // Placeholder
      const myMusicCoherence = { overall: 0.75 }; // Placeholder

      // Compare sonic palettes (skip for now)
      const sonicAlignment = 0.5; // Neutral placeholder

      // Compare BPM ranges
      const bpmOverlap = this.compareBpmRanges(djTracks, myMusicTracks);

      // Compare energy levels
      const energyAlignment = this.compareEnergy(djTracks, myMusicTracks);

      // Compare key/tonality
      const keyAlignment = this.compareKeys(djTracks, myMusicTracks);

      // Overall alignment score (weighted without sonic palette for now)
      const overall = Math.round(
        (bpmOverlap * 0.4 +
         energyAlignment * 0.35 +
         keyAlignment * 0.25) * 100
      );

      // Generate insights
      const insights = this.generateInsights({
        djTracks,
        myMusicTracks,
        djSonicPalette,
        myMusicSonicPalette,
        djCoherence,
        myMusicCoherence,
        sonicAlignment,
        bpmOverlap,
        energyAlignment,
        keyAlignment,
        overall
      });

      return {
        available: true,
        overall,
        sonicAlignment: Math.round(sonicAlignment * 100),
        bpmOverlap: Math.round(bpmOverlap * 100),
        energyAlignment: Math.round(energyAlignment * 100),
        keyAlignment: Math.round(keyAlignment * 100),
        djContext: {
          trackCount: djTracks.length,
          coherence: djCoherence,
          sonicPalette: djSonicPalette
        },
        myMusicContext: {
          trackCount: myMusicTracks.length,
          coherence: myMusicCoherence,
          sonicPalette: myMusicSonicPalette
        },
        insights
      };
    } catch (error) {
      console.error('Context comparison error:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Compare sonic palettes between contexts
   * Returns similarity score (0-1)
   */
  compareSonicPalettes(palette1, palette2) {
    if (!palette1.sonicPalette || !palette2.sonicPalette) {
      return 0.5;
    }

    // Compare dominant frequency bands
    const bands1 = palette1.sonicPalette.map(p => p.band);
    const bands2 = palette2.sonicPalette.map(p => p.band);

    // Count overlapping bands
    const overlap = bands1.filter(b => bands2.includes(b)).length;
    const maxBands = Math.max(bands1.length, bands2.length);
    const bandSimilarity = overlap / maxBands;

    // Compare tonal characteristics (simple keyword matching)
    const tonal1 = (palette1.tonalCharacteristics || '').toLowerCase();
    const tonal2 = (palette2.tonalCharacteristics || '').toLowerCase();

    const tonalKeywords = ['warm', 'bright', 'dark', 'metallic', 'organic', 'energetic', 'calm'];
    const tonal1Words = tonalKeywords.filter(k => tonal1.includes(k));
    const tonal2Words = tonalKeywords.filter(k => tonal2.includes(k));

    const tonalOverlap = tonal1Words.filter(w => tonal2Words.includes(w)).length;
    const tonalSimilarity = tonalOverlap / Math.max(tonal1Words.length, tonal2Words.length, 1);

    // Weighted average
    return bandSimilarity * 0.6 + tonalSimilarity * 0.4;
  }

  /**
   * Compare BPM ranges between contexts
   * Returns overlap score (0-1)
   */
  compareBpmRanges(tracks1, tracks2) {
    const bpms1 = tracks1.map(t => t.bpm).filter(b => b > 0);
    const bpms2 = tracks2.map(t => t.bpm).filter(b => b > 0);

    if (bpms1.length === 0 || bpms2.length === 0) return 0.5;

    const min1 = Math.min(...bpms1);
    const max1 = Math.max(...bpms1);
    const min2 = Math.min(...bpms2);
    const max2 = Math.max(...bpms2);

    // Calculate range overlap
    const overlapStart = Math.max(min1, min2);
    const overlapEnd = Math.min(max1, max2);

    if (overlapStart >= overlapEnd) {
      // No overlap - calculate gap penalty
      const gap = Math.abs(min1 - min2);
      return Math.max(0, 1 - gap / 50); // 50 BPM gap = 0 similarity
    }

    const overlapSize = overlapEnd - overlapStart;
    const totalRange = Math.max(max1, max2) - Math.min(min1, min2);

    return overlapSize / totalRange;
  }

  /**
   * Compare energy levels between contexts
   * Returns similarity score (0-1)
   */
  compareEnergy(tracks1, tracks2) {
    const energies1 = tracks1.map(t => t.energy).filter(e => e !== null && e !== undefined);
    const energies2 = tracks2.map(t => t.energy).filter(e => e !== null && e !== undefined);

    if (energies1.length === 0 || energies2.length === 0) return 0.5;

    const avg1 = energies1.reduce((sum, e) => sum + e, 0) / energies1.length;
    const avg2 = energies2.reduce((sum, e) => sum + e, 0) / energies2.length;

    // Similarity based on how close the averages are
    const diff = Math.abs(avg1 - avg2);
    return Math.max(0, 1 - diff);
  }

  /**
   * Compare key/tonality distributions
   * Returns similarity score (0-1)
   */
  compareKeys(tracks1, tracks2) {
    const keys1 = tracks1.map(t => t.key).filter(k => k);
    const keys2 = tracks2.map(t => t.key).filter(k => k);

    if (keys1.length === 0 || keys2.length === 0) return 0.5;

    // Count key occurrences
    const keyCount1 = {};
    const keyCount2 = {};

    keys1.forEach(k => keyCount1[k] = (keyCount1[k] || 0) + 1);
    keys2.forEach(k => keyCount2[k] = (keyCount2[k] || 0) + 1);

    // Calculate distribution similarity (Jaccard similarity)
    const allKeys = new Set([...Object.keys(keyCount1), ...Object.keys(keyCount2)]);
    let intersection = 0;
    let union = 0;

    allKeys.forEach(key => {
      const count1 = keyCount1[key] || 0;
      const count2 = keyCount2[key] || 0;
      intersection += Math.min(count1, count2);
      union += Math.max(count1, count2);
    });

    return union > 0 ? intersection / union : 0.5;
  }

  /**
   * Generate human-readable insights
   */
  generateInsights(data) {
    const {
      djTracks,
      myMusicTracks,
      djCoherence,
      myMusicCoherence,
      sonicAlignment,
      bpmOverlap,
      energyAlignment,
      overall
    } = data;

    const insights = [];

    // Overall assessment
    if (overall >= 75) {
      insights.push('Your DJ taste and production style are highly aligned - you play what you make.');
    } else if (overall >= 50) {
      insights.push('Your DJ taste and productions overlap but explore different territories.');
    } else {
      insights.push('Your DJ sets and productions represent distinct sonic worlds.');
    }

    // BPM insights
    const djBpms = djTracks.map(t => t.bpm).filter(b => b > 0);
    const myBpms = myMusicTracks.map(t => t.bpm).filter(b => b > 0);

    if (djBpms.length > 0 && myBpms.length > 0) {
      const avgDjBpm = djBpms.reduce((sum, b) => sum + b, 0) / djBpms.length;
      const avgMyBpm = myBpms.reduce((sum, b) => sum + b, 0) / myBpms.length;
      const bpmDiff = Math.abs(avgDjBpm - avgMyBpm);

      if (bpmDiff > 10) {
        insights.push(
          avgDjBpm > avgMyBpm
            ? `You DJ ${Math.round(bpmDiff)} BPM faster than you produce (${Math.round(avgDjBpm)} vs ${Math.round(avgMyBpm)}).`
            : `You produce ${Math.round(bpmDiff)} BPM faster than you DJ (${Math.round(avgMyBpm)} vs ${Math.round(avgDjBpm)}).`
        );
      }
    }

    // Coherence insights
    if (djCoherence.overall > myMusicCoherence.overall + 0.15) {
      insights.push('Your DJ taste is more consistent than your productions - you experiment more in the studio.');
    } else if (myMusicCoherence.overall > djCoherence.overall + 0.15) {
      insights.push('Your productions are more cohesive than your DJ sets - you explore more variety in curation.');
    }

    // Energy insights
    const djEnergies = djTracks.map(t => t.energy).filter(e => e !== null && e !== undefined);
    const myEnergies = myMusicTracks.map(t => t.energy).filter(e => e !== null && e !== undefined);

    if (djEnergies.length > 0 && myEnergies.length > 0) {
      const avgDjEnergy = djEnergies.reduce((sum, e) => sum + e, 0) / djEnergies.length;
      const avgMyEnergy = myEnergies.reduce((sum, e) => sum + e, 0) / myEnergies.length;

      if (Math.abs(avgDjEnergy - avgMyEnergy) > 0.2) {
        insights.push(
          avgDjEnergy > avgMyEnergy
            ? 'You DJ high-energy sets but produce more introspective music.'
            : 'Your productions are more energetic than the tracks you DJ.'
        );
      }
    }

    return insights;
  }
}

module.exports = new ContextComparisonService();
