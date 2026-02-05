const Database = require('better-sqlite3');
const path = require('path');

/**
 * Migration: Add musical_context column to audio_tracks
 * Contexts: 'dj_collection', 'my_music', 'personal_library', 'unknown'
 */

const dbPath = path.join(__dirname, '../../starforge_audio.db');
const db = new Database(dbPath);

console.log('🔄 Running migration: Add musical_context to audio_tracks');

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(audio_tracks)").all();
  const hasColumn = tableInfo.some(col => col.name === 'musical_context');

  if (hasColumn) {
    console.log('✅ Column musical_context already exists. Skipping migration.');
  } else {
    // Add the column
    db.exec(`
      ALTER TABLE audio_tracks
      ADD COLUMN musical_context TEXT DEFAULT 'unknown';
    `);

    console.log('✅ Added musical_context column');

    // Update existing records based on source
    db.exec(`
      UPDATE audio_tracks
      SET musical_context = CASE
        WHEN source = 'rekordbox' THEN 'dj_collection'
        WHEN source = 'upload' THEN 'my_music'
        ELSE 'unknown'
      END;
    `);

    const updated = db.prepare("SELECT COUNT(*) as count FROM audio_tracks WHERE musical_context != 'unknown'").get();
    console.log(`✅ Updated ${updated.count} existing records with context`);
  }

  // Show current stats
  const stats = db.prepare(`
    SELECT
      musical_context,
      COUNT(*) as count
    FROM audio_tracks
    GROUP BY musical_context
  `).all();

  console.log('\n📊 Current context distribution:');
  stats.forEach(stat => {
    console.log(`   ${stat.musical_context}: ${stat.count} tracks`);
  });

  console.log('\n✅ Migration complete!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
