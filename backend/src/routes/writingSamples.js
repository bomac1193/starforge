const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../starforge_audio.db');

/**
 * Writing Samples API
 * Store and retrieve user's writing examples to train AI voice
 */

/**
 * POST /api/writing-samples
 * Save user's writing samples
 */
router.post('/', (req, res) => {
  try {
    const { userId = 'default_user', socialPosts, subconsciousWriting } = req.body;

    if ((!socialPosts || socialPosts.trim().length < 50) &&
        (!subconsciousWriting || subconsciousWriting.trim().length < 50)) {
      return res.status(400).json({
        success: false,
        error: 'At least one type of writing must be 50+ characters'
      });
    }

    const db = new Database(dbPath);

    const totalCharacters = (socialPosts?.length || 0) + (subconsciousWriting?.length || 0);

    // Combine for legacy field
    const combined = [socialPosts, subconsciousWriting].filter(Boolean).join('\n\n---\n\n');

    // Upsert writing samples
    const stmt = db.prepare(`
      INSERT INTO user_writing_samples
        (user_id, writing_samples, social_posts, subconscious_writing, total_characters, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        writing_samples = excluded.writing_samples,
        social_posts = excluded.social_posts,
        subconscious_writing = excluded.subconscious_writing,
        total_characters = excluded.total_characters,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(userId, combined, socialPosts || null, subconsciousWriting || null, totalCharacters);

    db.close();

    res.json({
      success: true,
      message: 'Writing samples saved',
      totalCharacters
    });
  } catch (error) {
    console.error('Error saving writing samples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/writing-samples
 * Get user's writing samples
 */
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';

    const db = new Database(dbPath);

    const samples = db.prepare(`
      SELECT social_posts, subconscious_writing, total_characters, updated_at
      FROM user_writing_samples
      WHERE user_id = ?
    `).get(userId);

    db.close();

    if (!samples) {
      return res.json({
        success: true,
        hasSamples: false,
        socialPosts: '',
        subconsciousWriting: ''
      });
    }

    res.json({
      success: true,
      hasSamples: true,
      socialPosts: samples.social_posts || '',
      subconsciousWriting: samples.subconscious_writing || '',
      totalCharacters: samples.total_characters,
      lastUpdated: samples.updated_at
    });
  } catch (error) {
    console.error('Error getting writing samples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/writing-samples
 * Delete user's writing samples
 */
router.delete('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';

    const db = new Database(dbPath);

    db.prepare('DELETE FROM user_writing_samples WHERE user_id = ?').run(userId);

    db.close();

    res.json({
      success: true,
      message: 'Writing samples deleted'
    });
  } catch (error) {
    console.error('Error deleting writing samples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
