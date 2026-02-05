const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('HALF-TIME DETECTION TEST');
console.log('Testing: IF YOU WERE HERE TONIGHT (178 BPM half-time)');
console.log('═══════════════════════════════════════════════════════\n');

async function runPythonAnalyzer(audioPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'src/python/audio_analyzer.py');
    const python = spawn('python3', [pythonScript, audioPath, '--json']);

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
        reject(new Error(`Python script failed: ${error}`));
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

  // Find the specific track (most recent upload)
  const track = db.prepare(`
    SELECT * FROM audio_tracks
    WHERE filename LIKE '%IF YOU WERE HERE%' AND source = 'upload'
    ORDER BY uploaded_at DESC
    LIMIT 1
  `).get();

  if (!track) {
    console.log('Track not found. Looking for any high-BPM track (>160)...');

    const highBpmTrack = db.prepare(`
      SELECT * FROM audio_tracks
      WHERE source = 'upload' AND bpm > 160
      ORDER BY bpm DESC
      LIMIT 1
    `).get();

    if (!highBpmTrack) {
      console.log('No high-BPM tracks found to test.');
      db.close();
      return;
    }

    console.log(`\nTesting high-BPM track: ${highBpmTrack.filename}`);
    console.log('─'.repeat(80));
    await testTrack(highBpmTrack);
  } else {
    console.log(`\nTesting: ${track.filename}`);
    console.log('─'.repeat(80));
    await testTrack(track);
  }

  db.close();
}

async function testTrack(track) {
  console.log(`Detected BPM: ${track.bpm ? track.bpm.toFixed(1) : 'N/A'}`);
  console.log(`Old Energy: ${track.energy ? track.energy.toFixed(3) : 'N/A'}\n`);

  try {
    const analysis = await runPythonAnalyzer(track.file_path);

    console.log('NEW ANALYSIS:');
    console.log(`  Detected BPM:   ${analysis.bpm.toFixed(1)}`);
    console.log(`  Effective BPM:  ${analysis.effective_bpm.toFixed(1)}`);
    console.log(`  Is Half-Time:   ${analysis.is_halftime ? 'YES ✓' : 'NO'}`);
    console.log(`  Energy Score:   ${analysis.energy.toFixed(3)}\n`);

    if (analysis.is_halftime) {
      console.log('✓ HALF-TIME DETECTED!');
      console.log(`  Track feels like ${analysis.effective_bpm.toFixed(0)} BPM (half of ${analysis.bpm.toFixed(0)} BPM)`);
      console.log(`  Energy reduced by ${((1 - analysis.energy / (analysis.energy / 0.6)) * 100).toFixed(0)}% to reflect slower feel`);
      console.log(`  Should be classified as: R&B/Ambient/Chill (not D&B/Jungle)\n`);
    } else {
      console.log(`  Track is NOT half-time, BPM = ${analysis.bpm.toFixed(0)}`);
      if (analysis.bpm > 160) {
        console.log(`  Should be classified as: D&B/Jungle/Breakbeat\n`);
      }
    }

    console.log('Genre Classification Guide:');
    if (analysis.is_halftime) {
      if (analysis.effective_bpm < 80) {
        console.log('  → R&B / Slow Jam (60-80 BPM half-time)');
      } else if (analysis.effective_bpm < 100) {
        console.log('  → Chill Trap / Lo-fi Hip Hop (80-100 BPM half-time)');
      } else if (analysis.effective_bpm < 120) {
        console.log('  → Ambient / Downtempo (100-120 BPM half-time)');
      }
    } else {
      if (analysis.bpm > 160) {
        console.log('  → Drum & Bass / Jungle (160-180 BPM)');
      } else if (analysis.bpm > 140) {
        console.log('  → Breakbeat / Footwork (140-160 BPM)');
      }
    }

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

main().catch(error => {
  console.error('\nTest failed:', error);
  process.exit(1);
});
