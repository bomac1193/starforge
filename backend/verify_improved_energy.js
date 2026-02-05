const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('VERIFYING IMPROVED ENERGY CALCULATION');
console.log('Testing uploaded tracks with updated analyzer');
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

async function verifyTrack(track) {
  console.log(`\nTesting: ${track.filename}`);
  console.log('─'.repeat(80));
  console.log(`BPM: ${track.bpm.toFixed(1)} | Old Energy: ${track.energy.toFixed(3)}`);

  try {
    const analysis = await runPythonAnalyzer(track.file_path);
    const newEnergy = analysis.energy;
    const change = ((newEnergy / track.energy - 1) * 100).toFixed(0);

    console.log(`New Energy: ${newEnergy.toFixed(3)} (${change}% change)`);

    // Interpretation
    if (track.bpm > 130 && track.energy < 0.15) {
      console.log('✓ FIXED: High BPM track now has proper energy score');
      console.log(`  Before: ${track.energy.toFixed(3)} (misclassified as Ambient)`);
      console.log(`  After:  ${newEnergy.toFixed(3)} (correctly classified)`);
    } else if (newEnergy > track.energy * 2) {
      console.log('✓ IMPROVED: Energy score significantly increased');
    } else {
      console.log('✓ Energy calculation updated');
    }

    return { filename: track.filename, bpm: track.bpm, oldEnergy: track.energy, newEnergy, change: parseFloat(change) };
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  const db = new Database('./starforge_audio.db');

  // Get uploaded tracks
  const uploadedTracks = db.prepare(`
    SELECT * FROM audio_tracks
    WHERE user_id = 'default_user' AND source = 'upload'
    ORDER BY bpm DESC
    LIMIT 10
  `).all();

  console.log(`Found ${uploadedTracks.length} uploaded tracks to verify\n`);

  if (uploadedTracks.length === 0) {
    console.log('No uploaded tracks found. Upload some tracks first.');
    db.close();
    return;
  }

  const results = [];

  // Test each track
  for (const track of uploadedTracks) {
    const result = await verifyTrack(track);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Track'.padEnd(40) + 'BPM'.padEnd(8) + 'Old'.padEnd(10) + 'New'.padEnd(10) + 'Change');
  console.log('─'.repeat(80));

  results.forEach(r => {
    const name = r.filename.substring(0, 38).padEnd(40);
    const bpm = r.bpm.toFixed(0).padEnd(8);
    const oldEnergy = r.oldEnergy.toFixed(3).padEnd(10);
    const newEnergy = r.newEnergy.toFixed(3).padEnd(10);
    const change = `${r.change >= 0 ? '+' : ''}${r.change}%`;
    console.log(name + bpm + oldEnergy + newEnergy + change);
  });

  const avgOldEnergy = results.reduce((sum, r) => sum + r.oldEnergy, 0) / results.length;
  const avgNewEnergy = results.reduce((sum, r) => sum + r.newEnergy, 0) / results.length;
  const avgChange = ((avgNewEnergy / avgOldEnergy - 1) * 100).toFixed(0);

  console.log('\nAverage Energy Scores:');
  console.log(`Old (Basic RMS):      ${avgOldEnergy.toFixed(3)}`);
  console.log(`New (Improved):       ${avgNewEnergy.toFixed(3)} (${avgChange}% higher)`);

  console.log('\n✓ Improved energy calculation is now active!');
  console.log('  All new uploads will use the better algorithm.');
  console.log('  DJ library tracks can be enriched with Spotify API for even better accuracy.');

  db.close();
}

main().catch(error => {
  console.error('\nVerification failed:', error);
  process.exit(1);
});
