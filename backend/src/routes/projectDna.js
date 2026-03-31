/**
 * Project DNA Routes
 *
 * POST /scan             — Trigger auto-scan of local project directories
 * POST /upload-and-scan  — Upload files + optional direction prompt → extract identity
 * POST /scan-directory   — Scan a user-provided directory path
 * GET /:userId           — Return cached Project DNA
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { readFile } = require('fs/promises');
const path = require('path');
const projectDnaService = require('../services/projectDnaService');

// Multer config — store uploads in memory (text files only, small)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 30 }, // 5MB per file, max 30 files
  fileFilter: (req, file, cb) => {
    const allowed = /\.(md|txt|json|ts|tsx|js|jsx|py|toml|yaml|yml|cfg|ini|rst|csv)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(null, false); // skip non-text files silently
    }
  },
});

// Trigger auto-scan of local project directories
router.post('/scan', async (req, res) => {
  try {
    const userId = req.body.userId || 'default';
    console.log(`[Project DNA] Auto-scanning for user: ${userId}`);

    const result = await projectDnaService.scanAndSave(userId);

    res.json({
      success: true,
      projectDNA: result,
      sourcesScanned: result.sourcesScanned.length,
    });
  } catch (error) {
    console.error('[Project DNA] Scan failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Upload files + optional direction prompt → extract identity
router.post('/upload-and-scan', upload.array('files', 30), async (req, res) => {
  try {
    const userId = req.body.userId || 'default';
    const direction = req.body.direction || '';

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded. Upload .md, .json, .ts, .js, .py, or other text files.',
      });
    }

    console.log(`[Project DNA] Upload scan for user: ${userId}, ${req.files.length} files`);

    // Convert multer files to {name, content} array
    const files = req.files.map(f => ({
      name: f.originalname,
      content: f.buffer.toString('utf-8'),
    }));

    const result = await projectDnaService.scanUploadedAndSave(userId, files, direction);

    res.json({
      success: true,
      projectDNA: result,
      sourcesScanned: result.sourcesScanned.length,
    });
  } catch (error) {
    console.error('[Project DNA] Upload scan failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Scan a user-provided directory path
router.post('/scan-directory', async (req, res) => {
  try {
    const userId = req.body.userId || 'default';
    const dirPath = req.body.path;

    if (!dirPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing "path" field. Provide the directory to scan.',
      });
    }

    console.log(`[Project DNA] Directory scan for user: ${userId}, path: ${dirPath}`);

    const result = await projectDnaService.scanDirectoryAndSave(userId, dirPath);

    res.json({
      success: true,
      projectDNA: result,
      sourcesScanned: result.sourcesScanned.length,
    });
  } catch (error) {
    console.error('[Project DNA] Directory scan failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get cached Project DNA
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId || 'default';
    const projectDNA = projectDnaService.getProjectDNA(userId);

    if (!projectDNA) {
      return res.status(404).json({
        success: false,
        error: 'No Project DNA found. Run a scan first.',
      });
    }

    res.json({
      success: true,
      projectDNA,
    });
  } catch (error) {
    console.error('[Project DNA] Get failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
