const express = require('express');
const router = express.Router();
const libraryService = require('../services/libraryService');
const catalogAnalysisService = require('../services/catalogAnalysisService');
const { requireFeature } = require('../middleware/subscription');

/**
 * Library API Routes
 * Handles track library management and catalog analysis
 */

/**
 * GET /api/library
 * Get paginated library with filters
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'uploaded_at',
      sortOrder: req.query.sortOrder || 'DESC',
      search: req.query.search || '',
      minBpm: req.query.minBpm ? parseFloat(req.query.minBpm) : null,
      maxBpm: req.query.maxBpm ? parseFloat(req.query.maxBpm) : null,
      minEnergy: req.query.minEnergy ? parseFloat(req.query.minEnergy) : null,
      maxEnergy: req.query.maxEnergy ? parseFloat(req.query.maxEnergy) : null,
      source: req.query.source || null
    };

    const library = libraryService.getLibrary(userId, options);

    res.json({
      success: true,
      ...library
    });
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/stats
 * Get quick library statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const stats = libraryService.getLibraryStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching library stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/track/:id
 * Get single track details
 */
router.get('/track/:id', async (req, res) => {
  try {
    const track = libraryService.getTrack(req.params.id);

    if (!track) {
      return res.status(404).json({
        success: false,
        error: 'Track not found'
      });
    }

    res.json({
      success: true,
      track
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/library/track/:id
 * Delete a track
 */
router.delete('/track/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const deleted = libraryService.deleteTrack(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Track not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: 'Track deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/library/tracks/delete
 * Bulk delete tracks
 */
router.post('/tracks/delete', async (req, res) => {
  try {
    const userId = req.body.user_id || 'default_user';
    const trackIds = req.body.trackIds || [];

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'trackIds must be a non-empty array'
      });
    }

    const deletedCount = libraryService.bulkDeleteTracks(trackIds, userId);

    res.json({
      success: true,
      deletedCount,
      message: `${deletedCount} track(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error bulk deleting tracks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/library/track/:id
 * Update track metadata
 */
router.put('/track/:id', async (req, res) => {
  try {
    const userId = req.body.user_id || 'default_user';
    const updates = req.body.updates || {};

    const updated = libraryService.updateTrack(req.params.id, userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Track not found or no valid fields to update'
      });
    }

    res.json({
      success: true,
      message: 'Track updated successfully'
    });
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/library/track/:id/rating
 * Update track star rating (0-5 stars)
 */
router.patch('/track/:id/rating', async (req, res) => {
  try {
    const userId = req.body.user_id || 'default_user';
    const rating = parseInt(req.body.rating);

    // Validate rating (0-5 scale)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 0 and 5'
      });
    }

    const updated = libraryService.updateTrack(req.params.id, userId, {
      rekordbox_star_rating: rating
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Track not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating updated successfully',
      rating
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/search
 * Search tracks
 */
router.get('/search', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const tracks = libraryService.searchTracks(userId, query, limit);

    res.json({
      success: true,
      tracks,
      count: tracks.length
    });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/catalog/analyze
 * Get full catalog analysis (cached)
 */
router.get('/catalog/analyze', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const forceRefresh = req.query.refresh === 'true';
    const mode = req.query.mode || 'hybrid';
    const granularity = req.query.granularity || 'detailed';

    const analysis = await catalogAnalysisService.getCatalogAnalysis(userId, forceRefresh, mode, granularity);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing catalog:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/library/catalog/history
 * Get analysis history
 */
router.get('/catalog/history', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const limit = parseInt(req.query.limit) || 12;

    const history = catalogAnalysisService.getAnalysisHistory(userId, limit);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
