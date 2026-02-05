const Database = require('better-sqlite3');
const path = require('path');

/**
 * Initialize writing samples table for storing user's writing style examples
 * Used to train AI generation to match user's voice
 */

const dbPath = path.join(__dirname, 'starforge_audio.db');
const db = new Database(dbPath);

try {
  console.log('Creating user_writing_samples table...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_writing_samples (
      user_id TEXT PRIMARY KEY,
      writing_samples TEXT NOT NULL,
      sample_count INTEGER DEFAULT 0,
      total_characters INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✓ user_writing_samples table created successfully');

  // Verify table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_writing_samples'").all();
  console.log('✓ Verified table exists:', tables);

  db.close();
  console.log('\n🎨 Writing Samples database initialized');
  process.exit(0);
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}
