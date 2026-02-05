const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sinkEnhanced = require('../services/sinkEnhanced');
const Database = require('better-sqlite3');

const router = express.Router();

// Database setup
const dbPath = path.join(__dirname, '../../starforge_audio.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS audio_tracks (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    duration_seconds REAL,

    -- Analysis results
    bpm REAL,
    key TEXT,
    energy REAL,
    valence REAL,
    loudness REAL,
    silence_ratio REAL,
    tempo_confidence REAL,

    -- Quality score
    quality_score REAL,
    quality_breakdown TEXT,

    -- User input
    star_rating INTEGER DEFAULT 0,
    thumbs INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,

    -- Metadata
    source TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMP,

    -- Rekordbox specific
    rekordbox_id TEXT,
    rekordbox_play_count INTEGER,
    rekordbox_star_rating INTEGER,
    rekordbox_color TEXT,
    rekordbox_comments TEXT
  );

  CREATE TABLE IF NOT EXISTS audio_highlights (
    id TEXT PRIMARY KEY,
    track_id TEXT,
    start_seconds REAL NOT NULL,
    end_seconds REAL NOT NULL,
    highlight_score REAL,
    reason TEXT,
    peak_feature TEXT,
    user_marked BOOLEAN DEFAULT 0,
    user_rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES audio_tracks(id)
  );

  CREATE TABLE IF NOT EXISTS rekordbox_imports (
    id TEXT PRIMARY KEY,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_tracks INTEGER,
    successful_imports INTEGER,
    failed_imports INTEGER,
    xml_file_path TEXT
  );

  CREATE TABLE IF NOT EXISTS taste_profiles (
    id INTEGER PRIMARY KEY,
    profile_data TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|flac|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

// ========================================
// Upload and Analyze
// ========================================

router.post('/upload-and-analyze', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Analyze with quality scoring and highlights
    const analysis = await sinkEnhanced.analyzeWithQuality(file.path);
    const highlights = await sinkEnhanced.detectHighlights(file.path, 3);

    // Generate unique ID
    const trackId = 'trk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Store in database
    db.prepare(`
      INSERT INTO audio_tracks (
        id, filename, file_path, duration_seconds,
        bpm, key, energy, valence, loudness, silence_ratio, tempo_confidence,
        quality_score, quality_breakdown, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trackId,
      file.originalname,
      file.path,
      analysis.duration,
      analysis.bpm,
      analysis.key,
      analysis.energy,
      analysis.valence,
      analysis.loudness,
      analysis.silenceRatio,
      analysis.tempoConfidence,
      analysis.qualityScore,
      JSON.stringify(analysis.qualityBreakdown),
      'upload'
    );

    // Store highlights
    for (const highlight of highlights) {
      const highlightId = 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO audio_highlights (
          id, track_id, start_seconds, end_seconds, highlight_score, reason, peak_feature
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        highlightId,
        trackId,
        highlight.startSeconds,
        highlight.endSeconds,
        highlight.score,
        highlight.reason,
        highlight.peakFeature
      );
    }

    res.json({
      success: true,
      track: {
        id: trackId,
        filename: file.originalname,
        analysis,
        highlights
      }
    });
  } catch (error) {
    console.error('Upload and analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Get Track Details
// ========================================

router.get('/tracks/:trackId', (req, res) => {
  try {
    const { trackId } = req.params;

    const track = db.prepare('SELECT * FROM audio_tracks WHERE id = ?').get(trackId);

    if (!track) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    // Get highlights
    const highlights = db.prepare('SELECT * FROM audio_highlights WHERE track_id = ?').all(trackId);

    // Parse JSON fields
    track.quality_breakdown = JSON.parse(track.quality_breakdown || '{}');

    res.json({
      success: true,
      track: {
        ...track,
        highlights
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Rate Track
// ========================================

router.post('/rate/:trackId', (req, res) => {
  try {
    const { trackId } = req.params;
    const { rating, vote } = req.body;

    if (rating !== undefined) {
      // Star rating (0-5)
      if (rating < 0 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be 0-5' });
      }

      db.prepare('UPDATE audio_tracks SET star_rating = ? WHERE id = ?').run(rating, trackId);
    } else if (vote !== undefined) {
      // Thumbs up/down (-1, 0, +1)
      if (![- 1, 0, 1].includes(vote)) {
        return res.status(400).json({ success: false, error: 'Vote must be -1, 0, or +1' });
      }

      db.prepare('UPDATE audio_tracks SET thumbs = ? WHERE id = ?').run(vote, trackId);
    } else {
      return res.status(400).json({ success: false, error: 'Provide rating or vote' });
    }

    const track = db.prepare('SELECT * FROM audio_tracks WHERE id = ?').get(trackId);

    res.json({
      success: true,
      track
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Import Rekordbox XML
// ========================================

router.post('/rekordbox/import-xml', upload.single('xml'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No XML file uploaded' });
    }

    const rekordboxData = await sinkEnhanced.parseRekordboxXML(file.path);

    // Generate import ID
    const importId = 'imp_' + Date.now();

    let successCount = 0;
    let failCount = 0;

    // Import tracks into database
    for (const track of rekordboxData.tracks) {
      try {
        const trackId = 'trk_rb_' + track.rekordboxId;

        db.prepare(`
          INSERT OR REPLACE INTO audio_tracks (
            id, filename, file_path, duration_seconds,
            bpm, key, star_rating,
            rekordbox_id, rekordbox_play_count, rekordbox_star_rating,
            rekordbox_color, rekordbox_comments, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          trackId,
          track.title,
          track.filePath,
          track.durationSeconds,
          track.bpm,
          track.key,
          track.starRating,
          track.rekordboxId,
          track.playCount,
          track.starRating,
          track.color,
          track.comments,
          'rekordbox'
        );

        successCount++;
      } catch (error) {
        console.error(`Failed to import track ${track.title}:`, error.message);
        failCount++;
      }
    }

    // Store import record
    db.prepare(`
      INSERT INTO rekordbox_imports (
        id, total_tracks, successful_imports, failed_imports, xml_file_path
      ) VALUES (?, ?, ?, ?, ?)
    `).run(importId, rekordboxData.totalTracks, successCount, failCount, file.path);

    // Generate taste profile
    const tasteProfile = sinkEnhanced.generateTasteProfile(rekordboxData);

    // Store taste profile
    db.prepare(`
      INSERT INTO taste_profiles (profile_data) VALUES (?)
    `).run(JSON.stringify(tasteProfile));

    res.json({
      success: true,
      import: {
        importId,
        totalTracks: rekordboxData.totalTracks,
        imported: successCount,
        failed: failCount,
        stats: rekordboxData.stats,
        tasteProfile
      }
    });
  } catch (error) {
    console.error('Rekordbox import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Get Rekordbox Stats
// ========================================

router.get('/rekordbox/stats', (req, res) => {
  try {
    const tracks = db.prepare('SELECT * FROM audio_tracks WHERE source = ?').all('rekordbox');

    if (tracks.length === 0) {
      return res.json({
        success: true,
        message: 'No Rekordbox data imported yet',
        stats: null
      });
    }

    // Calculate stats
    const totalPlays = tracks.reduce((sum, t) => sum + (t.rekordbox_play_count || 0), 0);
    const avgRating = tracks
      .filter(t => t.rekordbox_star_rating > 0)
      .reduce((sum, t, _, arr) => sum + t.rekordbox_star_rating / arr.length, 0);

    const mostPlayed = tracks
      .filter(t => t.rekordbox_play_count > 0)
      .sort((a, b) => b.rekordbox_play_count - a.rekordbox_play_count)
      .slice(0, 20);

    const highestRated = tracks
      .filter(t => t.rekordbox_star_rating > 0)
      .sort((a, b) => b.rekordbox_star_rating - a.rekordbox_star_rating)
      .slice(0, 20);

    res.json({
      success: true,
      stats: {
        totalTracks: tracks.length,
        totalPlays,
        avgRating: Math.round(avgRating * 10) / 10,
        mostPlayed: mostPlayed.map(t => ({
          filename: t.filename,
          playCount: t.rekordbox_play_count,
          starRating: t.rekordbox_star_rating
        })),
        highestRated: highestRated.map(t => ({
          filename: t.filename,
          starRating: t.rekordbox_star_rating,
          playCount: t.rekordbox_play_count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Get Taste Profile
// ========================================

router.get('/taste-profile', (req, res) => {
  try {
    const latest = db.prepare('SELECT * FROM taste_profiles ORDER BY generated_at DESC LIMIT 1').get();

    if (!latest) {
      return res.json({
        success: true,
        message: 'No taste profile generated yet',
        profile: null
      });
    }

    res.json({
      success: true,
      profile: JSON.parse(latest.profile_data),
      generatedAt: latest.generated_at
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Find Best Version
// ========================================

router.post('/find-best-version', async (req, res) => {
  try {
    const { trackIds } = req.body;

    if (!trackIds || trackIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide trackIds array' });
    }

    // Get tracks from database
    const placeholders = trackIds.map(() => '?').join(',');
    const tracks = db.prepare(`SELECT * FROM audio_tracks WHERE id IN (${placeholders})`).all(...trackIds);

    // Prepare for best version analysis
    const trackAnalyses = tracks.map(t => ({
      id: t.id,
      filename: t.filename,
      qualityScore: t.quality_score,
      rating: t.star_rating || t.thumbs,
      similarity: 1.0 // Would be calculated from embeddings
    }));

    // Find best version
    const ranked = await sinkEnhanced.findBestVersion(trackAnalyses);

    res.json({
      success: true,
      ranked
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// List All Tracks
// ========================================

router.get('/tracks', (req, res) => {
  try {
    const { source, minRating, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM audio_tracks WHERE 1=1';
    const params = [];

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    if (minRating) {
      query += ' AND (star_rating >= ? OR rekordbox_star_rating >= ?)';
      params.push(minRating, minRating);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const tracks = db.prepare(query).all(...params);

    res.json({
      success: true,
      tracks,
      count: tracks.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
