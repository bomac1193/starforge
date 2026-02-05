/**
 * AI Generation Routes
 * Generate content using personal AI twin trained on aesthetic DNA
 * DIFFERENTIATOR: AI trained on YOUR proven taste, not generic ChatGPT
 */

const express = require('express');
const router = express.Router();
const aiTwinService = require('../services/aiTwinService');
const { requireFeature } = require('../middleware/subscription');

/**
 * POST /api/ai/generate-bio
 * Generate artist bio using aesthetic DNA
 * Requires: Pro tier or higher
 */
router.post('/generate-bio', requireFeature('ai_generation'), async (req, res) => {
  try {
    const { userId = 'default_user', tone = 'sophisticated', length = 'medium' } = req.body;

    const result = await aiTwinService.generateArtistBio(userId, { tone, length });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating bio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/generate-caption
 * Generate social media caption
 * Requires: Pro tier or higher
 */
router.post('/generate-caption', requireFeature('ai_generation'), async (req, res) => {
  try {
    const {
      userId = 'default_user',
      context = '',
      style = 'minimal'
    } = req.body;

    const result = await aiTwinService.generateCaption(userId, context, { style });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating caption:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/generate-press-release
 * Generate press release paragraph
 * Requires: Pro tier or higher
 */
router.post('/generate-press-release', requireFeature('ai_generation'), async (req, res) => {
  try {
    const {
      userId = 'default_user',
      eventContext = ''
    } = req.body;

    const result = await aiTwinService.generatePressRelease(userId, eventContext);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating press release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/aesthetic-dna
 * Get user's complete aesthetic DNA (for preview before generation)
 */
router.get('/aesthetic-dna', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';

    const aestheticDNA = await aiTwinService.getAestheticDNA(userId);

    res.json({
      success: true,
      aestheticDNA
    });
  } catch (error) {
    console.error('Error getting aesthetic DNA:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/generation-history
 * Get user's AI generation history
 */
router.get('/generation-history', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const limit = parseInt(req.query.limit) || 20;

    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../starforge_audio.db');
    const db = new Database(dbPath);

    const history = db.prepare(`
      SELECT
        id,
        generation_type,
        output,
        created_at
      FROM ai_generations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    db.close();

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting generation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
