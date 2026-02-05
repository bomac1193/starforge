const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('RE-DETECTING BPM WITH ESSENTIA');
console.log('More accurate BPM detection for complex rhythms');
console.log('═══════════════════════════════════════════════════════\n');

async function detectBpmEssentia(audioPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'src/python/bpm_essentia.py');
    const python = spawn('python3', [pythonScript, audioPath]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`BPM detection failed: ${error}`));
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

async function main() {
  const db = new Database('./starforge_audio.db');

  const tracks = db.prepare(`
    SELECT id, filename, file_path, bpm as old_bpm
    FROM audio_tracks
    WHERE source = 'upload'
  `).all();

  console.log(`Re-detecting BPM for ${tracks.length} uploaded tracks...\n`);

  let fixed = 0;
  let errors = 0;

  for (const track of tracks) {
    process.stdout.write(`${track.filename.substring(0, 50).padEnd(50)} `);

    try {
      const result = await detectBpmEssentia(track.file_path);

      if (result.error) {
        console.log(`✗ ${result.error}`);
        errors++;
        continue;
      }

      const newBpm = result.bpm;
      const oldBpm = track.old_bpm;
      const diff = Math.abs(newBpm - oldBpm);
      const percentDiff = (diff / oldBpm) * 100;

      // Update database
      db.prepare(`
        UPDATE audio_tracks
        SET bpm = ?,
            effective_bpm = ?
        WHERE id = ?
      `).run(newBpm, newBpm, track.id);

      if (percentDiff > 10) {
        console.log(`✓ FIXED`);
        console.log(`  Old: ${oldBpm.toFixed(1)} BPM`);
        console.log(`  New: ${newBpm.toFixed(1)} BPM (${percentDiff.toFixed(0)}% diff, confidence: ${result.confidence.toFixed(2)})`);
      } else {
        console.log(`✓ ${newBpm.toFixed(1)} BPM (confirmed)`);
      }

      fixed++;
    } catch (error) {
      console.log(`✗ ${error.message}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('BPM RE-DETECTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✓ Re-detected: ${fixed}`);
  console.log(`✗ Errors: ${errors}`);

  if (fixed > 0) {
    console.log('\n✓ Run reanalyze_uploads.js to update energy with correct BPMs');
    console.log('✓ Then refresh browser to see updated classifications');
  }

  db.close();
}

main().catch(error => {
  console.error('\nBPM detection failed:', error);
  process.exit(1);
});
