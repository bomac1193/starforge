const express = require('express');
const router = express.Router();
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const dbPath = path.join(__dirname, '../../starforge_audio.db');
const upload = multer({ dest: 'uploads/audio/' });

// In-memory store for batch jobs
const batchJobs = new Map();

/**
 * Run parallel Python batch analyzer
 */
async function runParallelAnalysis(tracksData) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `tracks_${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(tracksData, null, 2));

    const pythonScript = path.join(__dirname, '../python/batch_analyzer.py');
    const python = spawn('python3', [pythonScript, tempFile]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      try { fs.unlinkSync(tempFile); } catch (e) { }

      if (code !== 0) {
        reject(new Error(`Batch analysis failed: ${error}`));
      } else {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${output}`));
        }
      }
    });
  });
}

/**
 * POST /api/audio/batch-upload
 * Upload and analyze multiple files in parallel with progress tracking
 */
router.post('/batch-upload', upload.array('audio', 100), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const userId = req.body.user_id || 'default_user';
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create job
  batchJobs.set(jobId, {
    status: 'processing',
    total: files.length,
    processed: 0,
    errors: [],
    results: [],
    startTime: Date.now()
  });

  // Return immediately with job ID
  res.json({
    success: true,
    jobId,
    message: `Processing ${files.length} files in parallel`,
    totalFiles: files.length
  });

  // Process in background
  processFilesInBackground(jobId, files, userId);
});

async function processFilesInBackground(jobId, files, userId) {
  const job = batchJobs.get(jobId);
  const db = new Database(dbPath);

  try {
    // Prepare track data for batch analysis
    const tracksData = files.map((file, i) => ({
      id: `trk_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      path: file.path,
      originalName: file.originalname
    }));

    console.log(`[${jobId}] Starting parallel analysis of ${files.length} files...`);

    // Run parallel analysis
    const results = await runParallelAnalysis(tracksData);

    console.log(`[${jobId}] Analysis complete, storing in database...`);

    // Store results in database
    for (const trackData of tracksData) {
      const analysis = results[trackData.id];

      if (!analysis || analysis.error) {
        job.errors.push({
          filename: trackData.originalName,
          error: analysis?.error || 'Analysis failed'
        });
        job.processed++;
        continue;
      }

      try {
        // Store in database
        db.prepare(`
          INSERT INTO audio_tracks (
            id, filename, file_path, duration_seconds,
            bpm, effective_bpm, is_halftime, key, energy, valence, loudness, silence_ratio, tempo_confidence,
            quality_score, quality_breakdown, source, musical_context, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          trackData.id,
          trackData.originalName,
          trackData.path,
          analysis.duration,
          analysis.bpm,
          analysis.effective_bpm || analysis.bpm,
          analysis.is_halftime ? 1 : 0,
          analysis.key,
          analysis.energy,
          analysis.valence,
          analysis.loudness,
          analysis.silence_ratio,
          analysis.tempo_confidence,
          analysis.quality_score || null,
          JSON.stringify(analysis.quality_breakdown || {}),
          'upload',
          'my_music',
          userId
        );

        job.results.push({
          id: trackData.id,
          filename: trackData.originalName,
          bpm: analysis.bpm,
          energy: analysis.energy,
          valence: analysis.valence
        });
      } catch (dbError) {
        job.errors.push({
          filename: trackData.originalName,
          error: `Database error: ${dbError.message}`
        });
      }

      job.processed++;
    }

    // Mark job complete
    job.status = 'completed';
    job.endTime = Date.now();
    job.duration = ((job.endTime - job.startTime) / 1000).toFixed(1);

    console.log(`[${jobId}] Complete! ${job.results.length} tracks, ${job.errors.length} errors, ${job.duration}s`);

  } catch (error) {
    console.error(`[${jobId}] Processing error:`, error);
    job.status = 'failed';
    job.error = error.message;
  } finally {
    db.close();
  }
}

/**
 * GET /api/audio/batch-status/:jobId
 * Get progress of a batch job
 */
router.get('/batch-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = batchJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  res.json({
    success: true,
    job: {
      status: job.status,
      total: job.total,
      processed: job.processed,
      progress: Math.round((job.processed / job.total) * 100),
      errors: job.errors,
      results: job.status === 'completed' ? job.results : [],
      duration: job.duration
    }
  });

  // Clean up completed jobs after 5 minutes
  if (job.status === 'completed' || job.status === 'failed') {
    setTimeout(() => {
      batchJobs.delete(jobId);
      console.log(`[${jobId}] Cleaned up job data`);
    }, 5 * 60 * 1000);
  }
});

/**
 * POST /api/audio/refresh-analytics
 * Re-analyze existing uploaded tracks with LUFS normalization
 */
router.post('/refresh-analytics', async (req, res) => {
  const userId = req.body.user_id || 'default_user';
  const jobId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const db = new Database(dbPath);
  const tracks = db.prepare(`
    SELECT id, filename, file_path
    FROM audio_tracks
    WHERE source = 'upload' AND user_id = ?
  `).all(userId);
  db.close();

  if (tracks.length === 0) {
    return res.json({
      success: true,
      message: 'No uploaded tracks to refresh'
    });
  }

  // Create job
  batchJobs.set(jobId, {
    status: 'processing',
    total: tracks.length,
    processed: 0,
    errors: [],
    results: [],
    startTime: Date.now()
  });

  res.json({
    success: true,
    jobId,
    message: `Refreshing analytics for ${tracks.length} tracks`,
    totalFiles: tracks.length
  });

  // Process in background
  refreshAnalyticsInBackground(jobId, tracks);
});

async function refreshAnalyticsInBackground(jobId, tracks) {
  const job = batchJobs.get(jobId);
  const db = new Database(dbPath);

  try {
    const tracksData = tracks.map(t => ({ id: t.id, path: t.file_path }));

    console.log(`[${jobId}] Refreshing analytics for ${tracks.length} tracks...`);

    const results = await runParallelAnalysis(tracksData);

    for (const track of tracks) {
      const analysis = results[track.id];

      if (!analysis || analysis.error) {
        job.errors.push({ filename: track.filename, error: analysis?.error || 'Analysis failed' });
        job.processed++;
        continue;
      }

      // Update database (keep existing BPM)
      db.prepare(`
        UPDATE audio_tracks
        SET energy = ?, valence = ?, loudness = ?, key = ?, is_halftime = ?
        WHERE id = ?
      `).run(
        analysis.energy,
        analysis.valence,
        analysis.loudness,
        analysis.key,
        analysis.is_halftime ? 1 : 0,
        track.id
      );

      job.results.push({
        id: track.id,
        filename: track.filename,
        energy: analysis.energy,
        valence: analysis.valence
      });

      job.processed++;
    }

    job.status = 'completed';
    job.endTime = Date.now();
    job.duration = ((job.endTime - job.startTime) / 1000).toFixed(1);

    console.log(`[${jobId}] Refresh complete! ${job.duration}s`);

  } catch (error) {
    console.error(`[${jobId}] Refresh error:`, error);
    job.status = 'failed';
    job.error = error.message;
  } finally {
    db.close();
  }
}

module.exports = router;
