const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../starforge_visual_dna.db');
let db = null;

function getDB() {
  if (!db) {
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS color_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        cultural_name TEXT,
        origin TEXT,
        rated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, color_hex)
      )
    `);
  }
  return db;
}

function rateColor(userId, colorData, rating) {
  const d = getDB();
  d.prepare(`
    INSERT INTO color_ratings (user_id, color_hex, rating, cultural_name, origin)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, color_hex) DO UPDATE SET
      rating = excluded.rating,
      cultural_name = excluded.cultural_name,
      origin = excluded.origin,
      rated_at = datetime('now')
  `).run(
    userId,
    colorData.hex,
    rating,
    colorData.culturalName ?? null,
    colorData.origin ?? null
  );
}

function getRatedColors(userId) {
  const d = getDB();
  return d.prepare(`
    SELECT * FROM color_ratings
    WHERE user_id = ?
    ORDER BY rating DESC, rated_at DESC
  `).all(userId);
}

function getMyPalette(userId) {
  const d = getDB();
  return d.prepare(`
    SELECT * FROM color_ratings
    WHERE user_id = ? AND rating >= 4
    ORDER BY rating DESC, rated_at DESC
  `).all(userId);
}

function getColorBoosts(userId) {
  const d = getDB();
  const rows = d.prepare(`
    SELECT color_hex, rating FROM color_ratings
    WHERE user_id = ?
  `).all(userId);

  const boosts = {};
  for (const row of rows) {
    switch (row.rating) {
      case 5: boosts[row.color_hex] = 2.0; break;
      case 4: boosts[row.color_hex] = 1.5; break;
      case 3: boosts[row.color_hex] = 1.0; break;
      case 2: boosts[row.color_hex] = 0.5; break;
      case 1: boosts[row.color_hex] = 0.0; break;
    }
  }
  return boosts;
}

function removeRating(userId, colorHex) {
  const d = getDB();
  d.prepare(`
    DELETE FROM color_ratings WHERE user_id = ? AND color_hex = ?
  `).run(userId, colorHex);
}

module.exports = {
  rateColor,
  getRatedColors,
  getMyPalette,
  getColorBoosts,
  removeRating,
};
