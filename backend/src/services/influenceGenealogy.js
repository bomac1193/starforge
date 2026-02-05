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
      // Get user's audio data
      const audioDb = new Database(path.join(__dirname, '../../starforge_audio.db'));
      const tracks = audioDb.prepare('SELECT * FROM audio_tracks WHERE 1=1 LIMIT 200').all();
      audioDb.close();

      if (tracks.length === 0) {
        return {
          available: false,
          message: 'No audio tracks available. Upload music to analyze your influence genealogy.'
        };
      }

      // Calculate user's sonic signature
      const userSignature = this.calculateUserSonicSignature(tracks);

      // Find matching genres
      const matches = this.findMatchingGenres(userSignature);

      if (matches.length === 0) {
        return {
          available: false,
          message: 'Could not match your music to genre lineages. Try adding more tracks.'
        };
      }

      // Get top match for primary lineage
      const primaryMatch = matches[0];
      const lineage = genreTaxonomy.getLineage(primaryMatch.genreId);
      const descendants = genreTaxonomy.getDescendants(primaryMatch.genreId);

      // Generate narrative
      const narrative = this.generateNarrative(lineage, primaryMatch, userSignature);

      // Build visual tree data
      const treeData = this.buildTreeData(lineage, descendants, primaryMatch);

      return {
        available: true,
        primaryGenre: primaryMatch.genre,
        matchScore: primaryMatch.score,
        lineage: lineage,
        descendants: descendants.slice(0, 5),
        narrative: narrative,
        treeData: treeData,
        alternativeMatches: matches.slice(1, 4),
        userSignature: userSignature,
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

  calculateUserSonicSignature(tracks) {
    const bpms = tracks.map(t => t.bpm).filter(b => b > 0);
    const energies = tracks.map(t => t.energy).filter(e => e !== null && e !== undefined);

    const avgBpm = bpms.length > 0 
      ? bpms.reduce((sum, b) => sum + b, 0) / bpms.length 
      : 120;

    const avgEnergy = energies.length > 0
      ? energies.reduce((sum, e) => sum + e, 0) / energies.length
      : 0.5;

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
