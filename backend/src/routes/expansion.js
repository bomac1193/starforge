/**
 * Expansion Engine Routes — Lineage Discovery
 *
 * POST /api/expansion/discover     — trigger discovery run
 * GET  /api/expansion/suggestions/:userId — cached results
 */

const express = require('express');
const router = express.Router();
const expansionEngine = require('../services/expansionEngine');

// Trigger a lineage discovery run
router.post('/discover', async (req, res) => {
  try {
    const { userId = 'default', audioDna, visualDna } = req.body;

    const result = await expansionEngine.discoverLineage(userId, {
      audioDna,
      visualDna,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Expansion] Discovery error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get cached suggestions
router.get('/suggestions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const suggestions = expansionEngine.getSuggestions(userId);

    if (!suggestions) {
      return res.json({
        success: true,
        suggestions: null,
        message: 'No lineage discoveries yet. Run a discovery session first.',
      });
    }

    res.json({
      success: true,
      ...suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
