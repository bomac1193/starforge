const Database = require('better-sqlite3');

console.log('═══════════════════════════════════════════════════════');
console.log('FIXING BPM FROM FILENAMES');
console.log('Extracting BPM values from track filenames');
console.log('═══════════════════════════════════════════════════════\n');

const db = new Database('./starforge_audio.db');

// Get all uploaded tracks
const tracks = db.prepare(`
  SELECT id, filename, bpm, effective_bpm
  FROM audio_tracks
  WHERE source = 'upload'
`).all();

console.log(`Checking ${tracks.length} uploaded tracks...\n`);

let fixed = 0;
let notFound = 0;

for (const track of tracks) {
  // Try to extract BPM from filename
  // Common patterns: "160", "160bpm", "160 BPM", "160_bpm"
  const bpmMatch = track.filename.match(/\b(\d{2,3})\s*(?:bpm|BPM)?\b/);

  if (bpmMatch) {
    const filenameBpm = parseInt(bpmMatch[1]);

    // Only use if it's a reasonable BPM (60-200)
    if (filenameBpm >= 60 && filenameBpm <= 200) {
      const detectedBpm = track.bpm;
      const diff = Math.abs(filenameBpm - detectedBpm);
      const percentDiff = (diff / filenameBpm) * 100;

      // If detected BPM is significantly different (>10%), use filename BPM
      if (percentDiff > 10) {
        console.log(`${track.filename}`);
        console.log(`  Detected: ${detectedBpm.toFixed(1)} BPM`);
        console.log(`  Filename: ${filenameBpm} BPM`);
        console.log(`  Difference: ${percentDiff.toFixed(0)}% - Using filename BPM ✓\n`);

        // Update database
        db.prepare(`
          UPDATE audio_tracks
          SET bpm = ?,
              effective_bpm = ?
          WHERE id = ?
        `).run(filenameBpm, filenameBpm, track.id);

        fixed++;
      } else {
        console.log(`${track.filename}: Detected ${detectedBpm.toFixed(0)} BPM matches filename ${filenameBpm} BPM ✓`);
      }
    }
  } else {
    notFound++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('BPM CORRECTION COMPLETE');
console.log('═══════════════════════════════════════════════════════');
console.log(`✓ Fixed from filename: ${fixed}`);
console.log(`- No BPM in filename: ${notFound}`);

if (fixed > 0) {
  console.log('\n✓ Refresh your browser to see updated BPMs!');
}

db.close();
