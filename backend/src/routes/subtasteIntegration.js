/**
 * Subtaste Integration Routes
 *
 * Proxy routes to the standalone Subtaste app (port 3001)
 * for quiz genome data. Falls back to local auto-classification
 * from subtasteService.js when Subtaste app is not running.
 *
 * GET /health           — Check if Subtaste app is reachable
 * GET /genome/:userId   — Fetch quiz-based genome from Subtaste
 * GET /auto/:userId     — Get auto-classification from local signals
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const subtasteService = require('../services/subtasteService');
const projectDnaService = require('../services/projectDnaService');
const sonicPaletteService = require('../services/sonicPaletteService');
const sinkEnhanced = require('../services/sinkEnhanced');

const audioDbPath = path.join(__dirname, '../../starforge_audio.db');

const SUBTASTE_URL = process.env.SUBTASTE_API_URL || 'http://localhost:3001';

// Health check — is Subtaste app running?
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SUBTASTE_URL}/api/health`, {
      timeout: 3000,
    });
    res.json({ connected: true, status: response.data });
  } catch {
    res.json({ connected: false });
  }
});

// Fetch quiz-based genome from Subtaste app
router.get('/genome/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await axios.get(`${SUBTASTE_URL}/api/v2/genome/${userId}`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      source: 'quiz',
      genome: response.data,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'No genome found. Take the Subtaste quiz to generate one.',
        quizUrl: `${SUBTASTE_URL}/quiz`,
      });
    }
    // Subtaste app not reachable — fall back to auto-classification
    res.status(503).json({
      success: false,
      error: 'Subtaste app not reachable',
      quizUrl: `${SUBTASTE_URL}/quiz`,
    });
  }
});

// Auto-classify from existing Starforge signals (no quiz needed)
router.get('/auto/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Gather all available signals
    const projectDNA = projectDnaService.getProjectDNA(userId === 'default_user' ? 'default' : userId);

    // Audio DNA from database
    let audioDNA = null;
    try {
      const db = new Database(audioDbPath, { readonly: true });
      const tracks = db.prepare('SELECT * FROM audio_tracks ORDER BY quality_score DESC LIMIT 100').all();
      if (tracks.length > 0) {
        const tasteCoherence = sinkEnhanced.calculateTasteCoherence(tracks);
        audioDNA = {
          taste_coherence: tasteCoherence.overall,
          sonic_palette: {},
          influence_genealogy: {},
        };
      }
      db.close();
    } catch { /* no audio DB */ }

    // Run classification with all available signals
    const result = subtasteService.classifyUser({
      projectDNA,
      audioDNA,
    });

    if (!result) {
      return res.json({
        success: true,
        source: 'auto',
        classification: null,
        message: 'Not enough signal for classification. Add more data sources.',
      });
    }

    res.json({
      success: true,
      source: 'auto',
      classification: result.classification,
      psychometrics: result.psychometrics,
    });
  } catch (error) {
    console.error('[Subtaste] Auto-classify error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
