const Database = require('better-sqlite3');
const spotifyService = require('./src/services/spotifyAudioFeatures');

/**
 * Enrich DJ Library tracks with Spotify audio features
 * Gets accurate energy, danceability, valence for Rekordbox tracks
 */

async function enrichDJLibrary(limit = 100) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('DJ LIBRARY ENRICHMENT WITH SPOTIFY API');
  console.log('═══════════════════════════════════════════════════════\n');

  const db = new Database('./starforge_audio.db');

  // Get DJ library tracks (Rekordbox imports) without Spotify data
  const tracks = db.prepare(`
    SELECT id, filename, rekordbox_title, rekordbox_artist, bpm, energy
    FROM audio_tracks
    WHERE user_id = 'default_user'
      AND source LIKE '%rekordbox%'
      AND (spotify_energy IS NULL OR spotify_energy = 0)
    LIMIT ?
  `).all(limit);

  console.log(`Found ${tracks.length} DJ library tracks to enrich\n`);

  if (tracks.length === 0) {
    console.log('No tracks need enrichment. All done!');
    db.close();
    return;
  }

  // Check if Spotify columns exist
  try {
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_id TEXT').run();
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_energy REAL').run();
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_danceability REAL').run();
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_valence REAL').run();
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_loudness REAL').run();
    db.prepare('ALTER TABLE audio_tracks ADD COLUMN spotify_key TEXT').run();
    console.log('✓ Created Spotify columns in database\n');
  } catch (e) {
    // Columns already exist
  }

  let enriched = 0;
  let notFound = 0;
  let errors = 0;

  // Process tracks
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const title = track.rekordbox_title || track.filename.replace(/\.(mp3|m4a|wav)$/i, '');
    const artist = track.rekordbox_artist;

    process.stdout.write(`\r[${i + 1}/${tracks.length}] Processing: ${title.substring(0, 50).padEnd(50)} `);

    try {
      const features = await spotifyService.getAudioFeaturesBySearch(title, artist);

      if (features) {
        // Update track with Spotify data
        db.prepare(`
          UPDATE audio_tracks
          SET spotify_id = ?,
              spotify_energy = ?,
              spotify_danceability = ?,
              spotify_valence = ?,
              spotify_loudness = ?,
              spotify_key = ?,
              energy = ?,
              valence = ?,
              key = ?
          WHERE id = ?
        `).run(
          features.spotifyId,
          features.energy,
          features.danceability,
          features.valence,
          features.loudness,
          features.key,
          features.energy, // Update main energy field
          features.valence, // Update main valence field
          features.key, // Update main key field
          track.id
        );

        enriched++;
        process.stdout.write('✓ Found\n');
      } else {
        notFound++;
        process.stdout.write('✗ Not found on Spotify\n');
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors++;
      process.stdout.write(`✗ Error: ${error.message}\n`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('ENRICHMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total processed: ${tracks.length}`);
  console.log(`✓ Enriched with Spotify: ${enriched} (${((enriched / tracks.length) * 100).toFixed(1)}%)`);
  console.log(`✗ Not found on Spotify: ${notFound} (${((notFound / tracks.length) * 100).toFixed(1)}%)`);
  console.log(`✗ Errors: ${errors}`);

  // Show examples of enriched tracks
  if (enriched > 0) {
    console.log('\n\nExample Enriched Tracks:');
    console.log('─'.repeat(80));

    const enrichedTracks = db.prepare(`
      SELECT filename, rekordbox_title, rekordbox_artist,
             spotify_energy, spotify_danceability, spotify_valence
      FROM audio_tracks
      WHERE spotify_energy IS NOT NULL
      LIMIT 5
    `).all();

    enrichedTracks.forEach((t, i) => {
      console.log(`${i + 1}. ${t.rekordbox_title || t.filename}`);
      console.log(`   Artist: ${t.rekordbox_artist || 'Unknown'}`);
      console.log(`   Energy: ${t.spotify_energy.toFixed(3)} | Danceability: ${t.spotify_danceability.toFixed(3)} | Valence: ${t.spotify_valence.toFixed(3)}`);
      console.log('');
    });
  }

  console.log('\n✓ Enrichment complete! Re-run catalog analysis to see improved results.');

  db.close();
}

// Run if called directly
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 100;

  enrichDJLibrary(limit).catch(error => {
    console.error('\n\nEnrichment failed:', error.message);
    console.error('\nMake sure to set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file');
    console.error('Get credentials at: https://developer.spotify.com/dashboard');
    process.exit(1);
  });
}

module.exports = { enrichDJLibrary };
