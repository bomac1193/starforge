const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'starforge_audio.db');
const db = new Database(dbPath);

try {
  console.log('Adding dual-layer training columns...');

  // Add columns for separate social/subconscious writing
  db.exec(`
    ALTER TABLE user_writing_samples ADD COLUMN social_posts TEXT;
  `);

  db.exec(`
    ALTER TABLE user_writing_samples ADD COLUMN subconscious_writing TEXT;
  `);

  // Migrate existing data to social_posts
  db.exec(`
    UPDATE user_writing_samples
    SET social_posts = writing_samples
    WHERE social_posts IS NULL AND writing_samples IS NOT NULL;
  `);

  console.log('✓ Dual-layer columns added');
  db.close();
  process.exit(0);
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('✓ Columns already exist');
    db.close();
    process.exit(0);
  }
  console.error('Migration error:', error);
  db.close();
  process.exit(1);
}
