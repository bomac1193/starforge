const Database = require('better-sqlite3');
const { spawn } = require('child_process');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('AUDIO ANALYSIS ACCURACY STRESS TEST');
console.log('Comparing: Current vs Improved vs Essentia (if available)');
console.log('════════════════════════════════════════════════════════════\n');

async function runPythonAnalyzer(audioPath, method = 'current') {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'src/python/audio_analyzer_improved.py');
    const python = spawn('python3', [pythonScript, audioPath, method]);

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

async function testTrackAnalysis(track) {
  console.log(`\nTesting: ${track.filename}`);
  console.log('─'.repeat(80));
  console.log(`BPM: ${track.bpm.toFixed(1)} | Current Energy: ${track.energy.toFixed(3)}`);

  const audioPath = track.file_path;

  // Test different methods
  const results = {
    current: { energy: track.energy },
    improved: null,
    essentia: null
  };

  try {
    // Test improved librosa
    const improved = await runPythonAnalyzer(audioPath, 'improved');
    results.improved = improved;
    console.log(`Improved Energy: ${improved.energy.toFixed(3)} (${((improved.energy / track.energy - 1) * 100).toFixed(0)}% change)`);
  } catch (e) {
    console.log(`Improved: Failed - ${e.message}`);
  }

  try {
    // Test Essentia (if available)
    const essentia = await runPythonAnalyzer(audioPath, 'essentia');
    results.essentia = essentia;
    console.log(`Essentia Energy: ${essentia.energy.toFixed(3)} (${((essentia.energy / track.energy - 1) * 100).toFixed(0)}% change)`);
  } catch (e) {
    console.log(`Essentia: Not available or failed`);
  }

  // Interpretation
  console.log('\nInterpretation:');
  if (track.bpm > 130 && track.energy < 0.1) {
    console.log('⚠️  HIGH BPM + LOW ENERGY = Likely misclassified as Ambient/Chill');
    console.log('   Expected: Club/Dance music (energy should be 0.5+)');
  } else if (track.bpm > 120 && track.energy < 0.2) {
    console.log('⚠️  Dance BPM + LOW ENERGY = Possible classification error');
    console.log('   Expected: House/Techno (energy should be 0.4+)');
  } else {
    console.log('✓  Energy seems reasonable for BPM');
  }

  return results;
}

async function main() {
  const db = new Database('./starforge_audio.db');

  // Get uploaded tracks
  const uploadedTracks = db.prepare(`
    SELECT * FROM audio_tracks
    WHERE user_id = 'default_user' AND source = 'upload'
    ORDER BY bpm DESC
  `).all();

  console.log(`Found ${uploadedTracks.length} uploaded tracks\n`);

  if (uploadedTracks.length === 0) {
    console.log('No uploaded tracks found. Upload some tracks to test.');
    db.close();
    return;
  }

  const testResults = [];

  // Test each track
  for (const track of uploadedTracks) {
    const result = await testTrackAnalysis(track);
    testResults.push({
      filename: track.filename,
      bpm: track.bpm,
      ...result
    });
  }

  // Summary
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('Energy Comparison:');
  console.log('─'.repeat(80));
  console.log('Track'.padEnd(40) + 'BPM'.padEnd(8) + 'Current'.padEnd(12) + 'Improved'.padEnd(12) + 'Essentia');
  console.log('─'.repeat(80));

  testResults.forEach(result => {
    const name = result.filename.substring(0, 38).padEnd(40);
    const bpm = result.bpm.toFixed(0).padEnd(8);
    const current = result.current.energy.toFixed(3).padEnd(12);
    const improved = result.improved ? result.improved.energy.toFixed(3).padEnd(12) : 'N/A'.padEnd(12);
    const essentia = result.essentia ? result.essentia.energy.toFixed(3) : 'N/A';
    console.log(name + bpm + current + improved + essentia);
  });

  // Statistics
  const avgCurrentEnergy = testResults.reduce((sum, r) => sum + r.current.energy, 0) / testResults.length;
  const improvedResults = testResults.filter(r => r.improved);
  const avgImprovedEnergy = improvedResults.length > 0
    ? improvedResults.reduce((sum, r) => sum + r.improved.energy, 0) / improvedResults.length
    : 0;

  console.log('\nAverage Energy Scores:');
  console.log(`Current Method:  ${avgCurrentEnergy.toFixed(3)}`);
  if (avgImprovedEnergy > 0) {
    console.log(`Improved Method: ${avgImprovedEnergy.toFixed(3)} (${((avgImprovedEnergy / avgCurrentEnergy - 1) * 100).toFixed(0)}% higher)`);
  }

  // Recommendations
  console.log('\n\nRecommendations:');
  console.log('─'.repeat(80));

  if (avgCurrentEnergy < 0.3) {
    console.log('⚠️  Current energy scores are very low (avg: ' + avgCurrentEnergy.toFixed(3) + ')');
    console.log('   This will cause misclassification of dance/club tracks as Ambient/Deep House');
    console.log('   RECOMMENDED: Switch to improved energy calculation or Essentia');
  }

  const highBpmLowEnergy = testResults.filter(r => r.bpm > 130 && r.current.energy < 0.15);
  if (highBpmLowEnergy.length > 0) {
    console.log(`\n⚠️  ${highBpmLowEnergy.length} tracks with high BPM (>130) but low energy (<0.15):`);
    highBpmLowEnergy.forEach(r => {
      console.log(`   - ${r.filename.substring(0, 50)} (${r.bpm.toFixed(0)} BPM, ${r.current.energy.toFixed(3)} energy)`);
    });
    console.log('   These are likely being misclassified as Ambient instead of Dance/Bass music');
  }

  db.close();
}

main().catch(error => {
  console.error('\nTest failed:', error);
  process.exit(1);
});
