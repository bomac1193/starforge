#!/usr/bin/env node

const Database = require('better-sqlite3');

/**
 * Manually fix BPM for known incorrect tracks
 * This script fixes tracks where librosa detected wrong BPM
 */

const db = new Database('./starforge_audio.db');

const fixes = [
  {
    name: 'PASSOUT BLOOD',
    pattern: '%PASSOUT%BLOOD%',
    correctBpm: 174,
    reason: 'Drum & Bass - detected as 86 (half)'
  },
  {
    name: 'SCREAMING IN THE ABYSS',
    pattern: '%SCREAMING%ABYSS%',
    correctBpm: 124,
    reason: 'Dubstep - detected as 147 (1.2x)'
  }
];

console.log('🔧 MANUAL BPM FIX');
console.log('==================\n');

fixes.forEach(fix => {
  const tracks = db.prepare(`
    SELECT id, filename, bpm, effective_bpm, is_halftime, genre
    FROM audio_tracks
    WHERE filename LIKE ?
  `).all(fix.pattern);

  if (tracks.length === 0) {
    console.log(`❌ No tracks found for "${fix.name}"`);
    return;
  }

  console.log(`\n🎵 ${fix.name} (${tracks.length} tracks)`);
  console.log(`   Reason: ${fix.reason}`);

  tracks.forEach(track => {
    const oldBpm = track.effective_bpm || track.bpm;
    console.log(`   • ${track.filename}`);
    console.log(`     OLD: ${oldBpm} BPM`);
    console.log(`     NEW: ${fix.correctBpm} BPM`);

    // Update with correct BPM
    db.prepare(`
      UPDATE audio_tracks
      SET bpm = ?,
          effective_bpm = ?,
          is_halftime = 0
      WHERE id = ?
    `).run(fix.correctBpm, fix.correctBpm, track.id);
  });

  console.log(`   ✅ Fixed ${tracks.length} tracks\n`);
});

console.log('\n==================');
console.log('✅ Manual BPM fixes complete');
console.log('\nNote: For better detection in future uploads, consider:');
console.log('1. Using BPM from filename when available');
console.log('2. Checking common multiples (2x, 0.5x, 1.5x)');
console.log('3. Genre-based BPM range validation\n');

db.close();
