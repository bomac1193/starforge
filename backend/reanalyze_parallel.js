const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('═══════════════════════════════════════════════════════');
console.log('PARALLEL RE-ANALYSIS WITH LUFS NORMALIZATION');
console.log('Fair energy comparison + faster processing');
console.log('═══════════════════════════════════════════════════════\n');

async function runParallelAnalysis(tracksData) {
  return new Promise((resolve, reject) => {
    // Write tracks to temp JSON file
    const tempFile = path.join(os.tmpdir(), `tracks_${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(tracksData, null, 2));

    const pythonScript = path.join(__dirname, 'src/python/batch_analyzer.py');
    const python = spawn('python3', [pythonScript, tempFile]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      const msg = data.toString();
      // Print progress messages
      if (msg.includes('Analyzing') || msg.includes('Success') || msg.includes('Errors')) {
        process.stderr.write(msg);
      }
      error += msg;
    });

    python.on('close', (code) => {
      // Clean up temp file
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

  // Prepare data for batch analyzer
  const tracksData = tracks.map(t => ({
    id: t.id,
    path: t.file_path
  }));

  console.log(`🚀 Starting parallel analysis (using ${os.cpus().length - 1} CPU cores)...\n`);
  const startTime = Date.now();

  try {
    // Run parallel analysis
    const results = await runParallelAnalysis(tracksData);

    console.log('\n📊 Updating database...\n');

    let updated = 0;
    let errors = 0;

    for (const track of tracks) {
      const analysis = results[track.id];

      if (!analysis || analysis.error) {
        console.log(`✗ ${track.filename}: ${analysis?.error || 'No result'}`);
        errors++;
        continue;
      }

      // Update database (keep existing BPM if set, only update energy/valence/etc)
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

      const energyChange = track.old_energy
        ? ((analysis.energy / track.old_energy - 1) * 100).toFixed(0)
        : 'N/A';
      const energyDirection = energyChange > 0 ? '+' : '';
      const halftimeFlag = analysis.is_halftime ? ' [HALF-TIME]' : '';

      console.log(`✓ ${track.filename.substring(0, 50)}${halftimeFlag}`);
      console.log(`  Energy: ${(analysis.energy * 100).toFixed(0)}% (${energyDirection}${energyChange}%), Valence: ${(analysis.valence * 100).toFixed(0)}%`);

      updated++;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('PARALLEL RE-ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✓ Updated: ${updated}`);
    console.log(`✗ Errors: ${errors}`);
    console.log(`⏱️  Time: ${elapsed}s (${(tracks.length / elapsed).toFixed(1)} tracks/sec)`);
    console.log('\n🎯 LUFS-normalized energy for fair comparison across all mastering styles!');
    console.log('✓ Refresh your browser to see updated energy scores!');

    db.close();
  } catch (error) {
    console.error('\n❌ Parallel analysis failed:', error.message);
    db.close();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\nRe-analysis failed:', error);
  process.exit(1);
});
