const express = require('express');
const router = express.Router();
const colorRatingService = require('../services/colorRatingService');
const visualDnaCache = require('../services/visualDnaCache');

// Rate a color
router.post('/rate', (req, res) => {
  try {
    const { userId, color, rating } = req.body;
    if (!userId || !color?.hex || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'userId, color.hex, and rating (1-5) required' });
    }

    colorRatingService.rateColor(userId, color, rating);

    // Invalidate visual DNA cache so next load reflects rating
    const numericId = userId === 'default_user' ? 1 : parseInt(userId);
    visualDnaCache.invalidateCache(numericId);

    res.json({ success: true, hex: color.hex, rating });
  } catch (error) {
    console.error('Error rating color:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all rated colors for a user
router.get('/:userId', (req, res) => {
  try {
    const ratings = colorRatingService.getRatedColors(req.params.userId);
    res.json({ success: true, ratings, count: ratings.length });
  } catch (error) {
    console.error('Error getting color ratings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get My Palette (Canon + Ancestor only)
router.get('/:userId/palette', (req, res) => {
  try {
    const palette = colorRatingService.getMyPalette(req.params.userId);
    res.json({ success: true, palette, count: palette.length });
  } catch (error) {
    console.error('Error getting palette:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a color rating
router.delete('/rate', (req, res) => {
  try {
    const { userId, colorHex } = req.body;
    if (!userId || !colorHex) {
      return res.status(400).json({ success: false, error: 'userId and colorHex required' });
    }

    colorRatingService.removeRating(userId, colorHex);

    const numericId = userId === 'default_user' ? 1 : parseInt(userId);
    visualDnaCache.invalidateCache(numericId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing color rating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
