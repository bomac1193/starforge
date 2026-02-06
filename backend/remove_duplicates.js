#!/usr/bin/env node

const Database = require('better-sqlite3');

/**
 * Remove Duplicate Files from Audio Library
 * Keeps the most recent upload for each filename
 */

const db = new Database('./starforge_audio.db');

console.log('🗑️  REMOVING DUPLICATE FILES');
console.log('================================\n');

// Find all duplicates
const duplicates = db.prepare(`
  SELECT filename, COUNT(*) as count
  FROM audio_tracks
  WHERE user_id = 'default_user'
  GROUP BY filename
  HAVING count > 1
  ORDER BY count DESC
`).all();

console.log(`Found ${duplicates.length} filenames with duplicates\n`);

let totalRemoved = 0;

// For each duplicate filename, keep only the newest
duplicates.forEach((dup, idx) => {
  // Get all tracks with this filename, ordered by upload date
  const tracks = db.prepare(`
    SELECT id, filename, uploaded_at, bpm, effective_bpm
    FROM audio_tracks
    WHERE user_id = 'default_user' AND filename = ?
    ORDER BY uploaded_at DESC
  `).all(dup.filename);

  // Keep the first (newest), delete the rest
  const toKeep = tracks[0];
  const toDelete = tracks.slice(1);

  console.log(`${idx + 1}. ${dup.filename}`);
  console.log(`   Keeping: ${toKeep.id} (uploaded ${toKeep.uploaded_at})`);
  console.log(`   Removing: ${toDelete.length} older copies`);

  // Delete the old ones
  toDelete.forEach(track => {
    // Also delete associated highlights
    db.prepare('DELETE FROM audio_highlights WHERE track_id = ?').run(track.id);
    db.prepare('DELETE FROM audio_tracks WHERE id = ?').run(track.id);
  });

  totalRemoved += toDelete.length;
  console.log('');
});

console.log('================================');
console.log(`✅ Removed ${totalRemoved} duplicate entries`);
console.log(`✅ ${duplicates.length} filenames now deduplicated`);

// Show final stats
const totalTracks = db.prepare('SELECT COUNT(*) as count FROM audio_tracks WHERE user_id = ?').get('default_user').count;
console.log(`\n📊 Total tracks remaining: ${totalTracks}`);

db.close();
