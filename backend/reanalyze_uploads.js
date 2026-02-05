const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('RE-ANALYZING UPLOADED TRACKS');
console.log('Applying improved energy calculation + half-time detection');
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
        reject(new Error(`Analysis failed: ${error}`));
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
    SELECT id, filename, file_path, bpm as old_bpm, energy as old_energy
    FROM audio_tracks
    WHERE source = 'upload'
  `).all();

  console.log(`Found ${tracks.length} uploaded tracks to re-analyze\n`);

  if (tracks.length === 0) {
    console.log('No uploaded tracks found.');
    db.close();
    return;
  }

  let reanalyzed = 0;
  let errors = 0;

  for (const track of tracks) {
    process.stdout.write(`Processing: ${track.filename.substring(0, 50).padEnd(50)} `);

    try {
      const analysis = await runPythonAnalyzer(track.file_path);

      // Update database with new analysis (keep existing BPM if already set)
      const useBpm = track.old_bpm || analysis.bpm;
      const useEffectiveBpm = analysis.is_halftime ? useBpm / 2 : useBpm;

      db.prepare(`
        UPDATE audio_tracks
        SET energy = ?,
            valence = ?,
            loudness = ?,
            key = ?,
            is_halftime = ?
        WHERE id = ?
      `).run(
        analysis.energy,
        analysis.valence,
        analysis.loudness,
        analysis.key,
        analysis.is_halftime ? 1 : 0,
        track.id
      );

      const energyChange = ((analysis.energy / track.old_energy - 1) * 100).toFixed(0);
      const halftimeFlag = analysis.is_halftime ? ' [HALF-TIME]' : '';

      console.log(`✓ ${halftimeFlag}`);
      console.log(`  Old: ${track.old_bpm.toFixed(0)} BPM, Energy ${track.old_energy.toFixed(3)}`);
      console.log(`  New: ${analysis.bpm.toFixed(0)} BPM → ${analysis.effective_bpm.toFixed(0)} BPM (effective), Energy ${analysis.energy.toFixed(3)} (${energyChange >= 0 ? '+' : ''}${energyChange}%)`);

      reanalyzed++;
    } catch (error) {
      console.log(`✗ ${error.message}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('RE-ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✓ Re-analyzed: ${reanalyzed}`);
  console.log(`✗ Errors: ${errors}`);

  console.log('\n✓ Refresh your browser to see updated genre classifications!');

  db.close();
}

main().catch(error => {
  console.error('\nRe-analysis failed:', error);
  process.exit(1);
});
