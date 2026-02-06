#!/usr/bin/env node

/**
 * Genre Matching Diagnostic Tool
 * Analyzes why tracks are being matched to specific genres
 * Helps identify false positives and algorithm bias
 */

const Database = require('better-sqlite3');
const path = require('path');
const genreTaxonomy = require('../services/genreTaxonomy');

const userId = process.argv[2] || 1;
const targetGenre = process.argv[3] || 'jersey-club';

console.log('🔍 Genre Matching Diagnostic Tool');
console.log('==================================\n');
console.log(`Analyzing matches for: ${targetGenre}`);
console.log(`User ID: ${userId}\n`);

// Get target genre
const genre = genreTaxonomy.db.prepare('SELECT * FROM genres WHERE slug = ?').get(targetGenre);

if (!genre) {
  console.error(`❌ Genre '${targetGenre}' not found`);
  process.exit(1);
}

console.log(`Genre: ${genre.name}`);
console.log(`BPM Range: ${genre.bpm_min}-${genre.bpm_max}`);
console.log(`Energy Range: ${genre.energy_min}-${genre.energy_max}`);
console.log(`Origin: ${genre.origin_location}`);
console.log(`Context: ${genre.cultural_context}\n`);

// Get user's tracks
const audioDb = new Database(path.join(__dirname, '../../starforge_audio.db'));
const tracks = audioDb.prepare('SELECT * FROM audio_tracks WHERE user_id = ?').all(userId);
audioDb.close();

console.log(`Total tracks: ${tracks.length}\n`);

// Analyze each track's match to this genre
const matches = [];

tracks.forEach(track => {
  const effectiveBpm = track.effective_bpm || track.bpm;

  // Genre tag check
  let genreTagBonus = 0;
  let tagReason = '';
  if (track.genre) {
    const trackGenre = track.genre.toLowerCase().trim();
    const genreName = genre.name.toLowerCase();

    if (trackGenre === genreName) {
      genreTagBonus = 40;
      tagReason = 'EXACT match';
    } else if (trackGenre.includes(genreName) || genreName.includes(trackGenre)) {
      genreTagBonus = 25;
      tagReason = 'PARTIAL match';
    } else if (trackGenre.includes('club') && genreName.includes('club')) {
      genreTagBonus = 30;
      tagReason = 'CLUB variant match (POTENTIAL FALSE POSITIVE)';
    } else if (trackGenre.includes('jersey') && genreName.includes('jersey')) {
      genreTagBonus = 30;
      tagReason = 'JERSEY match';
    }
  }

  // BPM check
  let bpmScore = 0;
  let bpmInRange = false;
  let bpmReason = '';

  if (effectiveBpm >= genre.bpm_min && effectiveBpm <= genre.bpm_max) {
    bpmInRange = true;
    const rangeSize = genre.bpm_max - genre.bpm_min;
    const genreBpmMid = (genre.bpm_min + genre.bpm_max) / 2;
    const distanceFromMid = Math.abs(effectiveBpm - genreBpmMid);
    const centralityScore = 1 - (distanceFromMid / (rangeSize / 2));
    const rangeSpecificityBonus = Math.max(0, 1 - (rangeSize / 30));
    bpmScore = (centralityScore * 0.4) + (rangeSpecificityBonus * 0.6);
    bpmReason = 'IN RANGE';
  } else {
    const genreBpmMid = (genre.bpm_min + genre.bpm_max) / 2;
    const bpmDistance = Math.abs(effectiveBpm - genreBpmMid);
    bpmScore = Math.max(0, 0.5 - (bpmDistance / 40));
    bpmReason = `OUT OF RANGE (${Math.round(bpmDistance)} BPM away)`;
  }

  // Energy check
  let energyScore = 0;
  let energyReason = '';
  if (track.energy !== null && track.energy !== undefined) {
    const genreEnergyMid = (genre.energy_min + genre.energy_max) / 2;
    const energyDistance = Math.abs(track.energy - genreEnergyMid);
    energyScore = Math.max(0, 1 - (energyDistance * 2));
    energyReason = energyDistance < 0.1 ? 'CLOSE match' : energyDistance < 0.2 ? 'MODERATE match' : 'WEAK match';
  }

  // Total score
  const totalScore = track.energy !== null
    ? (bpmScore * 0.5 + energyScore * 0.3) * 100 + genreTagBonus
    : (bpmScore * 100) + genreTagBonus;

  if (totalScore > 30) {
    matches.push({
      title: track.title || 'Unknown',
      artist: track.artist || 'Unknown',
      bpm: effectiveBpm,
      energy: track.energy,
      genre_tag: track.genre || 'none',
      bpm_in_range: bpmInRange,
      bpm_reason: bpmReason,
      bpm_score: bpmScore.toFixed(2),
      energy_score: energyScore.toFixed(2),
      tag_bonus: genreTagBonus,
      tag_reason: tagReason,
      total_score: totalScore.toFixed(1)
    });
  }
});

matches.sort((a, b) => parseFloat(b.total_score) - parseFloat(a.total_score));

console.log(`\n📊 MATCHES FOUND: ${matches.length} tracks match ${genre.name}\n`);

if (matches.length === 0) {
  console.log('✅ NO FALSE POSITIVES: No tracks matched this genre.');
  console.log('   If this genre shows up in your distribution, there may be a bug.\n');
} else {
  console.log('Top 10 matches:\n');
  matches.slice(0, 10).forEach((m, i) => {
    console.log(`${i + 1}. "${m.title}" by ${m.artist}`);
    console.log(`   BPM: ${m.bpm} ${m.bpm_in_range ? '✅' : '❌'} (${m.bpm_reason})`);
    console.log(`   Energy: ${m.energy ? (m.energy * 100).toFixed(0) + '%' : 'N/A'}`);
    console.log(`   Genre Tag: "${m.genre_tag}" ${m.tag_reason ? `(${m.tag_reason})` : ''}`);
    console.log(`   Scores: BPM=${m.bpm_score}, Energy=${m.energy_score}, Tag Bonus=${m.tag_bonus}`);
    console.log(`   TOTAL: ${m.total_score} ${parseFloat(m.total_score) > 60 ? '🔥 STRONG' : parseFloat(m.total_score) > 45 ? '⚠️ MODERATE' : '❓ WEAK'}`);
    console.log('');
  });

  // Analysis
  console.log('\n📈 ANALYSIS:\n');

  const tagMatches = matches.filter(m => m.tag_bonus > 0).length;
  const bpmMatches = matches.filter(m => m.bpm_in_range).length;
  const strongMatches = matches.filter(m => parseFloat(m.total_score) > 60).length;

  console.log(`• ${tagMatches}/${matches.length} matches have genre tag bonuses`);
  console.log(`• ${bpmMatches}/${matches.length} matches are in BPM range`);
  console.log(`• ${strongMatches}/${matches.length} are STRONG matches (>60 score)`);

  if (tagMatches > bpmMatches) {
    console.log('\n⚠️  WARNING: More tag matches than BPM matches!');
    console.log('   This suggests Rekordbox genre tags may be driving the match.');
    console.log('   Check if your tracks are tagged "Club", "Jersey", etc.');
  }

  if (strongMatches < matches.length * 0.3) {
    console.log('\n⚠️  WARNING: Less than 30% are strong matches!');
    console.log('   This genre may be a FALSE POSITIVE or weak classification.');
  }

  const avgBpm = matches.reduce((sum, m) => sum + m.bpm, 0) / matches.length;
  console.log(`\n• Average BPM of matches: ${avgBpm.toFixed(1)}`);
  console.log(`• Genre BPM range: ${genre.bpm_min}-${genre.bpm_max}`);

  if (Math.abs(avgBpm - ((genre.bpm_min + genre.bpm_max) / 2)) > 10) {
    console.log('\n⚠️  WARNING: Average BPM is far from genre center!');
    console.log('   Matches may be hitting the edge of the range.');
  }
}

console.log('\n' + '='.repeat(50));
console.log('VERDICT:');
if (matches.length === 0) {
  console.log('❌ This genre should NOT appear in your distribution.');
} else if (strongMatches > matches.length * 0.5) {
  console.log('✅ This genre appears to be LEGITIMATE.');
} else if (tagMatches > bpmMatches * 1.5) {
  console.log('⚠️  SUSPICIOUS: Heavily driven by genre tags, not sonic characteristics.');
} else {
  console.log('❓ QUESTIONABLE: Weak matches, may be algorithm bias.');
}
console.log('='.repeat(50) + '\n');
