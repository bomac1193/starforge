const genreTaxonomy = require('./genreTaxonomy');
const Database = require('better-sqlite3');
const path = require('path');

/**
 * Influence Genealogy Service
 * Matches user's sonic palette to genre lineages
 * Elite tier feature - shows taste evolution and heritage
 */
class InfluenceGenealogyService {
  
  /**
   * Analyze user's music and generate influence genealogy
   */
  async analyzeInfluenceGenealogy(userId, options = {}) {
    try {
      // Get ALL user's audio data (no limit for proper nuanced analysis)
      const audioDb = new Database(path.join(__dirname, '../../starforge_audio.db'));
      const tracks = audioDb.prepare('SELECT * FROM audio_tracks WHERE user_id = ?').all(userId);
      audioDb.close();

      if (tracks.length === 0) {
        return {
          available: false,
          message: 'No audio tracks available. Upload music to analyze your influence genealogy.'
        };
      }

      // NUANCED ANALYSIS: Cluster tracks into sonic groups
      const clusters = this.clusterTracksByGenre(tracks);

      if (clusters.length === 0) {
        return {
          available: false,
          message: 'Could not match your music to genre lineages.'
        };
      }

      // Get top cluster as primary
      const primaryCluster = clusters[0];
      const lineage = genreTaxonomy.getLineage(primaryCluster.genreId);
      const descendants = genreTaxonomy.getDescendants(primaryCluster.genreId);

      // Generate narrative with multiple influences
      const narrative = this.generateMultiInfluenceNarrative(clusters, tracks.length);

      // Build visual tree data
      const treeData = this.buildTreeData(lineage, descendants, primaryCluster);

      return {
        available: true,
        // Multiple influences with percentages
        influences: clusters.map(c => ({
          genre: c.genre,
          percentage: c.percentage,
          trackCount: c.trackCount,
          avgBpm: c.avgBpm,
          avgEnergy: c.avgEnergy
        })),
        primaryGenre: primaryCluster.genre,
        matchScore: primaryCluster.percentage,
        lineage: lineage,
        descendants: descendants.slice(0, 5),
        narrative: narrative,
        treeData: treeData,
        trackCount: tracks.length
      };

    } catch (error) {
      console.error('Error analyzing influence genealogy:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Cluster tracks by genre (with preference weighting)
   * Returns multiple influences with percentages
   */
  clusterTracksByGenre(tracks) {
    const weights = this.calculatePreferenceWeights(tracks);
    const allGenres = genreTaxonomy.db.prepare('SELECT * FROM genres').all();

    // Match each track to genres
    const trackGenreMatches = tracks.map((track, i) => {
      const matches = allGenres
        .map(genre => ({
          genre,
          score: this.calculateTrackGenreMatch(track, genre)
        }))
        .filter(m => m.score > 30)
        .sort((a, b) => b.score - a.score);

      return {
        track,
        weight: weights[i],
        bestMatch: matches[0] || null
      };
    });

    // Group by genre and calculate weighted percentages
    const genreClusters = {};
    let totalWeight = 0;

    trackGenreMatches.forEach(({ track, weight, bestMatch }) => {
      if (!bestMatch) return;

      const genreId = bestMatch.genre.id;
      if (!genreClusters[genreId]) {
        genreClusters[genreId] = {
          genreId,
          genre: bestMatch.genre,
          weightedCount: 0,
          bpms: [],
          energies: []
        };
      }

      genreClusters[genreId].weightedCount += weight;
      totalWeight += weight;

      if (track.bpm) genreClusters[genreId].bpms.push(track.bpm);
      if (track.energy !== null) genreClusters[genreId].energies.push(track.energy);
    });

    // Calculate percentages and averages
    const clusters = Object.values(genreClusters)
      .map(cluster => ({
        ...cluster,
        percentage: parseFloat(((cluster.weightedCount / totalWeight) * 100).toFixed(1)),
        trackCount: Math.round(cluster.weightedCount * 10) / 10,
        avgBpm: cluster.bpms.length > 0
          ? Math.round(cluster.bpms.reduce((a, b) => a + b, 0) / cluster.bpms.length)
          : null,
        avgEnergy: cluster.energies.length > 0
          ? parseFloat((cluster.energies.reduce((a, b) => a + b, 0) / cluster.energies.length).toFixed(2))
          : null
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5); // Top 5 influences

    return clusters;
  }

  /**
   * Match individual track to genre
   */
  calculateTrackGenreMatch(track, genre) {
    if (!track.bpm || track.energy === null) return 0;

    // BPM match
    const genreBpmMid = (genre.bpm_min + genre.bpm_max) / 2;
    const bpmDistance = Math.abs(track.bpm - genreBpmMid);
    const bpmScore = Math.max(0, 1 - (bpmDistance / 30));

    // Energy match
    const genreEnergyMid = (genre.energy_min + genre.energy_max) / 2;
    const energyDistance = Math.abs(track.energy - genreEnergyMid);
    const energyScore = Math.max(0, 1 - (energyDistance * 2));

    return (bpmScore * 0.6 + energyScore * 0.4) * 100;
  }

  /**
   * Generate narrative with multiple influences
   */
  generateMultiInfluenceNarrative(clusters, totalTracks) {
    if (clusters.length === 0) return 'Your taste defies traditional classification.';

    const primary = clusters[0];
    const lineage = genreTaxonomy.getLineage(primary.genreId);

    let narrative = `Your taste spans ${clusters.length} distinct influences across ${totalTracks} tracks:\n\n`;

    clusters.forEach((cluster, i) => {
      const genre = cluster.genre;
      narrative += `${i + 1}. ${genre.name} (${cluster.percentage}%) - ${genre.cultural_context}\n`;
    });

    if (lineage.length > 1) {
      narrative += `\nPrimary lineage traces: ${lineage.map(g => g.name).join(' → ')}`;
    }

    return narrative;
  }

  /**
   * Calculate preference weight (play count + star rating)
   */
  calculatePreferenceWeights(tracks) {
    const maxPlayCount = Math.max(...tracks.map(t => t.rekordbox_play_count || t.play_count || 0), 1);

    return tracks.map(track => {
      const playCount = track.rekordbox_play_count || track.play_count || 0;
      const rating = track.rekordbox_star_rating || track.star_rating || 0;

      const normalizedPlayCount = playCount / maxPlayCount;
      const normalizedRating = rating / 5;

      // 60% play count (revealed), 40% rating (conscious)
      const weight = (normalizedPlayCount * 0.6) + (normalizedRating * 0.4);
      return weight > 0 ? weight : 0.1;
    });
  }

  /**
   * Weighted average helper
   */
  weightedAverage(values, weights) {
    if (values.length === 0) return 0;
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
  }

  /**
   * Calculate user sonic signature (PREFERENCE WEIGHTED)
   */
  calculateUserSonicSignature(tracks) {
    const weights = this.calculatePreferenceWeights(tracks);

    // Get tracks with BPM and their weights
    const bpms = [];
    const bpmWeights = [];
    tracks.forEach((t, i) => {
      if (t.bpm && t.bpm > 0) {
        bpms.push(t.bpm);
        bpmWeights.push(weights[i]);
      }
    });

    // Get tracks with energy and their weights
    const energies = [];
    const energyWeights = [];
    tracks.forEach((t, i) => {
      if (t.energy !== null && t.energy !== undefined) {
        energies.push(t.energy);
        energyWeights.push(weights[i]);
      }
    });

    const avgBpm = this.weightedAverage(bpms, bpmWeights) || 120;
    const avgEnergy = this.weightedAverage(energies, energyWeights) || 0.5;

    const bpmVariance = this.calculateVariance(bpms);
    const energyVariance = this.calculateVariance(energies);

    return {
      avgBpm: Math.round(avgBpm),
      avgEnergy: parseFloat(avgEnergy.toFixed(2)),
      bpmVariance: parseFloat(bpmVariance.toFixed(2)),
      energyVariance: parseFloat(energyVariance.toFixed(2)),
      trackCount: tracks.length
    };
  }

  findMatchingGenres(userSignature) {
    const allGenres = genreTaxonomy.db.prepare('SELECT * FROM genres').all();
    const matches = [];

    allGenres.forEach(genre => {
      const score = this.calculateMatchScore(userSignature, genre);
      if (score > 0) {
        matches.push({
          genreId: genre.id,
          genre: genre,
          score: parseFloat(score.toFixed(2))
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  }

  calculateMatchScore(userSignature, genre) {
    const genreBpmMid = (genre.bpm_min + genre.bpm_max) / 2;
    const genreBpmRange = genre.bpm_max - genre.bpm_min;
    const bpmDistance = Math.abs(userSignature.avgBpm - genreBpmMid);
    const bpmScore = Math.max(0, 1 - (bpmDistance / (genreBpmRange + 20)));

    const genreEnergyMid = (genre.energy_min + genre.energy_max) / 2;
    const energyDistance = Math.abs(userSignature.avgEnergy - genreEnergyMid);
    const energyScore = Math.max(0, 1 - (energyDistance * 2));

    const currentYear = new Date().getFullYear();
    const genreAge = genre.era_start ? currentYear - genre.era_start : 30;
    const eraScore = Math.max(0.3, 1 - (genreAge / 100));

    const totalScore = (bpmScore * 0.4) + (energyScore * 0.3) + (eraScore * 0.3);

    return totalScore * 100;
  }

  generateNarrative(lineage, primaryMatch, userSignature) {
    if (lineage.length === 0) {
      return 'Your musical taste is unique and defies traditional genre classification.';
    }

    const root = lineage[0];
    const current = lineage[lineage.length - 1];

    const narrativeParts = [];

    narrativeParts.push(
      'Your taste descends from ' + root.name + ' (' + root.decade + '), ' +
      'originating in ' + root.origin_location + '.'
    );

    if (lineage.length > 2) {
      const middle = lineage.slice(1, -1).map(g => g.name + ' (' + g.decade + ')').join(', ');
      narrativeParts.push(
        'It evolved through ' + middle + ', reflecting the cultural shifts of each era.'
      );
    }

    narrativeParts.push(
      'Today, your sound aligns most closely with ' + current.name + ' ' +
      '(' + Math.round(primaryMatch.score) + '% match), characterized by ' +
      current.description.toLowerCase() + '.'
    );

    narrativeParts.push(
      'Your sonic signature: ' + userSignature.avgBpm + ' BPM average, ' +
      (userSignature.avgEnergy * 100).toFixed(0) + '% energy level.'
    );

    return narrativeParts.join(' ');
  }

  buildTreeData(lineage, descendants, primaryMatch) {
    const nodes = [];
    const edges = [];

    lineage.forEach((genre, index) => {
      nodes.push({
        id: 'genre-' + genre.id,
        label: genre.name,
        era: genre.decade,
        type: index === lineage.length - 1 ? 'current' : 'ancestor',
        description: genre.description
      });

      if (index > 0) {
        edges.push({
          from: 'genre-' + lineage[index - 1].id,
          to: 'genre-' + genre.id,
          label: genre.era_start
        });
      }
    });

    const currentGenre = lineage[lineage.length - 1];
    nodes.push({
      id: 'user-current',
      label: 'Your Taste (2026)',
      era: '2020s',
      type: 'user',
      description: primaryMatch.score + '% match to ' + currentGenre.name
    });

    edges.push({
      from: 'genre-' + currentGenre.id,
      to: 'user-current',
      label: '2026'
    });

    descendants.slice(0, 3).forEach(genre => {
      nodes.push({
        id: 'genre-' + genre.id,
        label: genre.name,
        era: genre.decade,
        type: 'descendant',
        description: genre.description
      });

      edges.push({
        from: 'user-current',
        to: 'genre-' + genre.id,
        label: genre.era_start,
        style: 'dashed'
      });
    });

    return { nodes, edges };
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
  }
}

module.exports = new InfluenceGenealogyService();
