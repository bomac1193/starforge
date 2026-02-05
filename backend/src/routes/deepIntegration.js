/**
 * Deep Integration Routes
 * Direct database access to CLAROSA and folder scanning for SINK
 */

const express = require('express');
const router = express.Router();
const clarosaDirectService = require('../services/clarosaServiceDirect');
const sinkFolderScanner = require('../services/sinkFolderScanner');
const visualDnaCache = require('../services/visualDnaCache');
const sonicPaletteService = require('../services/sonicPaletteService');
const sinkEnhanced = require('../services/sinkEnhanced');
const crossModalAnalyzer = require('../services/crossModalAnalyzer');
const contextComparisonService = require('../services/contextComparisonService');
const Database = require('better-sqlite3');
const path = require('path');

// Audio database connection
const audioDbPath = path.join(__dirname, '../../starforge_audio.db');
let audioDB = null;

const getAudioDB = () => {
  if (!audioDB) {
    audioDB = new Database(audioDbPath);
  }
  return audioDB;
};

// ========================================
// CLAROSA DIRECT DATABASE ACCESS
// ========================================

/**
 * GET /api/deep/clarosa/profile
 * Get user's actual CLAROSA profile with stats
 */
router.get('/clarosa/profile', (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const profile = clarosaDirectService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'CLAROSA database not found or profile not available'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error getting CLAROSA profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/clarosa/top-photos
 * Get user's actual top-rated photos from CLAROSA
 */
router.get('/clarosa/top-photos', (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const minScore = parseFloat(req.query.min_score) || 60;

    const photos = clarosaDirectService.getTopPhotos(userId, limit, minScore);

    res.json({
      success: true,
      photos,
      count: photos.length
    });
  } catch (error) {
    console.error('Error getting top photos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/clarosa/visual-dna
 * Extract complete visual DNA from user's CLAROSA photos
 * Now includes sophisticated color analysis and marketing-grade descriptions
 * Uses intelligent caching for fast subsequent loads
 */
router.get('/clarosa/visual-dna', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const forceRefresh = req.query.refresh === 'true';

    const visualDNA = await clarosaDirectService.extractVisualDNA(userId, forceRefresh);

    if (!visualDNA) {
      return res.status(404).json({
        success: false,
        error: 'Could not extract visual DNA'
      });
    }

    res.json({
      success: true,
      visualDNA
    });
  } catch (error) {
    console.error('Error extracting visual DNA:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/deep/clarosa/visual-dna/refresh
 * Force refresh Visual DNA cache
 */
router.post('/clarosa/visual-dna/refresh', async (req, res) => {
  try {
    const userId = parseInt(req.body.user_id) || 1;

    // Invalidate cache
    visualDnaCache.invalidateCache(userId);

    // Generate fresh Visual DNA
    const visualDNA = await clarosaDirectService.extractVisualDNA(userId, true);

    res.json({
      success: true,
      visualDNA,
      message: 'Visual DNA refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing visual DNA:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/clarosa/visual-dna/cache-stats
 * Get cache statistics
 */
router.get('/clarosa/visual-dna/cache-stats', (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const stats = visualDnaCache.getCacheStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/clarosa/curation
 * Get photos grouped by curation category (highlight, keep, review, delete)
 */
router.get('/clarosa/curation', (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const categories = clarosaDirectService.getCurationCategories(userId);

    if (!categories) {
      return res.status(404).json({
        success: false,
        error: 'Could not get curation categories'
      });
    }

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error getting curation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// SINK FOLDER SCANNING
// ========================================

/**
 * POST /api/deep/sink/scan-folder
 * Scan entire folder for audio files
 */
router.post('/sink/scan-folder', async (req, res) => {
  try {
    const { folderPath, maxDepth, maxFiles, skipHidden } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: 'folderPath is required'
      });
    }

    const files = await sinkFolderScanner.scanFolder(folderPath, {
      maxDepth: maxDepth || 10,
      maxFiles: maxFiles || 1000,
      skipHidden: skipHidden !== false
    });

    res.json({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Error scanning folder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/deep/sink/analyze-catalog
 * Analyze entire music catalog with pattern recognition
 */
router.post('/sink/analyze-catalog', async (req, res) => {
  try {
    const { folderPath, batchSize, parallel } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: 'folderPath is required'
      });
    }

    // Start scan
    const files = await sinkFolderScanner.scanFolder(folderPath);

    // Analyze in background and send updates via SSE (for now, return immediately)
    // In production, use WebSockets or SSE for real-time updates

    // Start analysis asynchronously
    sinkFolderScanner.analyzeBatch(files, {
      batchSize: batchSize || 10,
      parallel: parallel || 2
    }).then(results => {
      console.log('Catalog analysis complete:', results.length, 'tracks');
    }).catch(error => {
      console.error('Catalog analysis failed:', error);
    });

    res.json({
      success: true,
      message: 'Catalog analysis started',
      filesQueued: files.length
    });
  } catch (error) {
    console.error('Error starting catalog analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/sink/analysis-status
 * Get current analysis status and results
 */
router.get('/sink/analysis-status', (req, res) => {
  try {
    const results = sinkFolderScanner.scanResults;
    const isScanning = sinkFolderScanner.isScanning;

    res.json({
      success: true,
      isScanning,
      totalAnalyzed: results.length,
      results: results.slice(0, 100) // Return first 100 for preview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/sink/pattern-analysis
 * Get deep pattern analysis of scanned catalog
 */
router.get('/sink/pattern-analysis', (req, res) => {
  try {
    const results = sinkFolderScanner.scanResults;

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No scan results available. Run catalog analysis first.'
      });
    }

    const patterns = sinkFolderScanner.generatePatternAnalysis(results);

    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Error generating pattern analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/deep/sink/generate-music
 * Generate new music based on catalog patterns (placeholder for future)
 */
router.post('/sink/generate-music', async (req, res) => {
  try {
    const { style, duration, basedOnTracks } = req.body;

    // Placeholder for music generation
    // Would integrate AudioCraft or Magenta here

    res.json({
      success: false,
      error: 'Music generation not yet implemented',
      message: 'This will integrate AudioCraft/Magenta for generative music based on your catalog patterns'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// AUDIO DNA ROUTES
// ========================================

/**
 * GET /api/deep/audio/sonic-palette?context=dj_collection|my_music|combined
 * Extract sonic palette from user's audio catalog with context filtering
 */
router.get('/audio/sonic-palette', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const forceRefresh = req.query.refresh === 'true';
    const context = req.query.context || 'combined'; // 'dj_collection', 'my_music', 'combined'

    // Get tracks from audio database with context filtering
    const db = getAudioDB();
    let tracks;

    if (context === 'combined') {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        ORDER BY quality_score DESC, uploaded_at DESC
        LIMIT 100
      `).all();
    } else {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        WHERE musical_context = ?
        ORDER BY quality_score DESC, uploaded_at DESC
        LIMIT 100
      `).all(context);
    }

    if (tracks.length === 0) {
      return res.status(404).json({
        success: false,
        error: context === 'dj_collection'
          ? 'No DJ collection tracks. Import Rekordbox XML to analyze DJ taste.'
          : context === 'my_music'
          ? 'No personal music tracks. Upload your productions to analyze.'
          : 'No audio tracks available. Upload tracks or import Rekordbox first.'
      });
    }

    // Include context in userId for separate caching
    const cacheUserId = context === 'combined' ? userId : `${userId}_${context}`;

    const sonicPalette = await sonicPaletteService.extractSonicPalette(
      cacheUserId,
      tracks,
      forceRefresh
    );

    res.json({
      success: true,
      context,
      trackCount: tracks.length,
      sonicPalette
    });
  } catch (error) {
    console.error('Error extracting sonic palette:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/deep/audio/sonic-palette/refresh
 * Force refresh sonic palette cache with context support
 */
router.post('/audio/sonic-palette/refresh', async (req, res) => {
  try {
    const userId = parseInt(req.body.user_id) || 1;
    const context = req.body.context || 'combined';

    // Get tracks from audio database with context filtering
    const db = getAudioDB();
    let tracks;

    if (context === 'combined') {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        ORDER BY quality_score DESC, uploaded_at DESC
        LIMIT 100
      `).all();
    } else {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        WHERE musical_context = ?
        ORDER BY quality_score DESC, uploaded_at DESC
        LIMIT 100
      `).all(context);
    }

    if (tracks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No audio tracks available'
      });
    }

    const cacheUserId = context === 'combined' ? userId : `${userId}_${context}`;
    const sonicPalette = await sonicPaletteService.refreshCache(cacheUserId, tracks);

    res.json({
      success: true,
      context,
      sonicPalette,
      message: 'Sonic palette refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing sonic palette:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/audio/sonic-palette/cache-stats
 * Get sonic palette cache statistics
 */
router.get('/audio/sonic-palette/cache-stats', (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;
    const stats = sonicPaletteService.getCacheStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/audio/taste-coherence?context=dj_collection|my_music|combined
 * Calculate taste coherence metrics with context filtering
 */
router.get('/audio/taste-coherence', (req, res) => {
  try {
    const context = req.query.context || 'combined';

    // Get tracks from audio database with context filtering
    const db = getAudioDB();
    let tracks;

    if (context === 'combined') {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        ORDER BY uploaded_at DESC
        LIMIT 200
      `).all();
    } else {
      tracks = db.prepare(`
        SELECT * FROM audio_tracks
        WHERE musical_context = ?
        ORDER BY uploaded_at DESC
        LIMIT 200
      `).all(context);
    }

    if (tracks.length === 0) {
      return res.status(404).json({
        success: false,
        error: context === 'dj_collection'
          ? 'No DJ collection tracks available'
          : context === 'my_music'
          ? 'No personal music tracks available'
          : 'No audio tracks available'
      });
    }

    const coherence = sinkEnhanced.calculateTasteCoherence(tracks);

    res.json({
      success: true,
      context,
      trackCount: tracks.length,
      coherence
    });
  } catch (error) {
    console.error('Error calculating taste coherence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/deep/cross-modal/analyze
 * Analyze cross-modal coherence between Visual DNA and Audio DNA
 */
router.post('/cross-modal/analyze', async (req, res) => {
  try {
    const { userId, visualDNA, audioDNA } = req.body;

    // If not provided, fetch from services
    let visual = visualDNA;
    let audio = audioDNA;

    if (!visual) {
      visual = await clarosaDirectService.extractVisualDNA(userId || 1);
    }

    if (!audio) {
      // Get tracks from audio database
      const db = getAudioDB();
      const tracks = db.prepare(`
        SELECT * FROM audio_tracks
        ORDER BY quality_score DESC, uploaded_at DESC
        LIMIT 100
      `).all();

      if (tracks.length > 0) {
        const sonicPalette = await sonicPaletteService.extractSonicPalette(
          userId || 1,
          tracks
        );
        const coherence = sinkEnhanced.calculateTasteCoherence(tracks);

        audio = {
          tonalCharacteristics: sonicPalette.tonalCharacteristics,
          dominantFrequencies: sonicPalette.dominantFrequencies,
          trackCount: tracks.length,
          tasteCoherence: coherence,
          avgEnergy: tracks.reduce((sum, t) => sum + (t.energy || 0.5), 0) / tracks.length
        };
      }
    }

    if (!visual || !audio) {
      return res.status(404).json({
        success: false,
        error: 'Missing visual or audio DNA'
      });
    }

    const coherence = crossModalAnalyzer.analyzeCrossModalCoherence(visual, audio);
    const detailedReport = crossModalAnalyzer.generateDetailedReport(visual, audio, coherence);

    res.json({
      success: true,
      coherence,
      detailedReport
    });
  } catch (error) {
    console.error('Error analyzing cross-modal coherence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/deep/audio/context-comparison
 * Compare DJ collection context vs personal music context
 * UNIQUE FEATURE: Multi-dimensional taste analysis for multi-hyphenate creators
 */
router.get('/audio/context-comparison', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 1;

    const comparison = await contextComparisonService.compareContexts(userId);

    if (!comparison.available) {
      return res.status(404).json({
        success: false,
        message: comparison.message,
        available: false
      });
    }

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Error comparing contexts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// COMBINED TWIN GENERATION (DEEP)
// ========================================

/**
 * POST /api/deep/twin/generate-complete
 * Generate complete Twin profile with direct database access
 */
router.post('/twin/generate-complete', async (req, res) => {
  try {
    const { userId, catalogPath } = req.body;

    console.log('Generating complete Twin with deep integration');

    // 1. Get visual DNA from CLAROSA (direct database)
    const visualDNA = clarosaDirectService.extractVisualDNA(userId || 1);
    const profile = clarosaDirectService.getUserProfile(userId || 1);

    // 2. Analyze catalog with SINK (if path provided)
    let audioDNA = null;
    if (catalogPath) {
      const files = await sinkFolderScanner.scanFolder(catalogPath, { maxFiles: 100 });
      const analyses = await sinkFolderScanner.analyzeBatch(files, { batchSize: 5, parallel: 2 });
      const patterns = sinkFolderScanner.generatePatternAnalysis(analyses);

      audioDNA = {
        totalTracks: analyses.length,
        patterns: patterns.patterns
      };
    }

    // 3. Combine into complete Twin profile
    const twinProfile = {
      // Visual DNA from CLAROSA
      visual: {
        styleDescription: visualDNA?.styleDescription || 'No visual data',
        topTags: visualDNA?.topTags || [],
        confidence: visualDNA?.confidence || 0,
        photoCount: visualDNA?.photoCount || 0,
        avgScores: visualDNA?.avgScores || {},
        topPhotos: visualDNA?.topPhotos || []
      },

      // Audio DNA from SINK
      audio: audioDNA || {
        message: 'No catalog analyzed. Provide catalogPath to analyze music library.'
      },

      // Profile metadata
      metadata: {
        userId: userId || 1,
        trainingComparisons: profile?.training?.total_comparisons || 0,
        confidenceScore: profile?.profile?.confidence_score || 0,
        generatedAt: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      twinProfile
    });
  } catch (error) {
    console.error('Error generating complete Twin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
