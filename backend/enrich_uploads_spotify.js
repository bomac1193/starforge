#!/usr/bin/env node

require('dotenv').config();
const Database = require('better-sqlite3');
const fetch = require('node-fetch');

/**
 * Enrich uploaded audio files with Spotify audio features
 * Parses artist/title from filename and searches Spotify
 */

let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials in .env file');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
  return spotifyToken;
}

function parseFilename(filename) {
  // Remove file extension
  let cleaned = filename.replace(/\.(mp3|m4a|wav|flac|aac)$/i, '');

  // Remove common prefixes
  cleaned = cleaned.replace(/^Y2Mate\.is - /, '');
  cleaned = cleaned.replace(/-\w{11}-\d+k-\d+$/, ''); // Remove YouTube ID
  cleaned = cleaned.replace(/^\d{2,3}\s+/, ''); // Remove leading track numbers (01, 02, etc.)

  // Remove version/project markers (these are NOT on Spotify)
  cleaned = cleaned.replace(/\s+\d+\.\d+.*$/, ''); // Remove " 1.2", " 3.5 something", etc.
  cleaned = cleaned.replace(/\s*\(.*?(?:Mix|mix|version|Version|edit|Edit|PROJECT|project|Mastering|mastering).*?\)/gi, ''); // Remove (Mix), (Project), etc.
  cleaned = cleaned.replace(/\s*\[.*?(?:Mix|mix|version|Version|edit|Edit).*?\]/gi, ''); // Remove [Mix], [Edit], etc.
  cleaned = cleaned.replace(/\s*\(clip\)/gi, ''); // Remove (CLIP)
  cleaned = cleaned.replace(/\s+v\d+$/i, ''); // Remove " v2", " v3"

  // Keep official markers like (Official Audio), (Official Video), (Remix), (Extended Mix)

  // Try to split by common separators
  let artist = null;
  let title = null;

  // Pattern: "Artist - Title"
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }
  // Pattern: "Artist – Title" (em dash)
  else if (cleaned.includes(' – ')) {
    const parts = cleaned.split(' – ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' – ').trim();
  }
  // Pattern: "Title (feat. Artist)"
  else if (cleaned.match(/\(.*feat\..*\)/i)) {
    title = cleaned;
  }
  // Just use the whole thing as title
  else {
    title = cleaned;
  }

  return { artist, title };
}

async function searchSpotify(title, artist) {
  const token = await getSpotifyToken();

  // Build search query - use simple concatenation (works better than track:/artist: syntax)
  let query = '';
  if (artist && title) {
    query = `${artist} ${title}`;
  } else if (title) {
    query = title;
  } else {
    return null;
  }

  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.tracks.items.length === 0) {
    return null;
  }

  // Return the first match (Spotify ranks by relevance)
  return data.tracks.items[0];
}

async function getAudioFeatures(trackId) {
  const token = await getSpotifyToken();

  const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function enrichLibrary(limit = 100, batchSize = 50) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('SPOTIFY AUDIO FEATURES ENRICHMENT');
  console.log('═══════════════════════════════════════════════════════\n');

  const db = new Database('./starforge_audio.db');

  // Get tracks without Spotify data
  // Prioritize tracks that look like commercial releases (more likely to be on Spotify)
  const tracks = db.prepare(`
    SELECT id, filename, bpm, energy, genre
    FROM audio_tracks
    WHERE user_id = 'default_user'
      AND spotify_energy IS NULL
      AND (
        filename LIKE '%feat%'
        OR filename LIKE '%feat.%'
        OR filename LIKE '%ft.%'
        OR filename LIKE '%ft %'
        OR filename LIKE '%Y2Mate%'
        OR filename LIKE '% - %'
        OR filename LIKE '%(Official%'
        OR filename LIKE '%Remix%'
        OR filename LIKE '%Edit%'
        OR filename LIKE '%[%]%'
        OR filename LIKE '%(%)%'
      )
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit);

  console.log(`Found ${tracks.length} tracks to enrich\n`);

  if (tracks.length === 0) {
    console.log('✅ No tracks need enrichment. All done!');
    db.close();
    return;
  }

  let enriched = 0;
  let notFound = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const { artist, title } = parseFilename(track.filename);

    const displayTitle = title || track.filename;
    const progress = `[${i + 1}/${tracks.length}]`;
    process.stdout.write(`\r${progress} ${displayTitle.substring(0, 60).padEnd(60)} `);

    try {
      // Search for track on Spotify
      const spotifyTrack = await searchSpotify(title, artist);

      if (!spotifyTrack) {
        notFound++;
        process.stdout.write('✗ Not found\n');
        continue;
      }

      // Get audio features
      const features = await getAudioFeatures(spotifyTrack.id);

      if (!features) {
        notFound++;
        process.stdout.write('✗ No features\n');
        continue;
      }

      // Update database
      db.prepare(`
        UPDATE audio_tracks
        SET spotify_id = ?,
            spotify_energy = ?,
            spotify_danceability = ?,
            spotify_valence = ?,
            spotify_loudness = ?,
            spotify_key = ?,
            spotify_enriched_at = CURRENT_TIMESTAMP,
            energy = COALESCE(energy, ?),
            valence = COALESCE(valence, ?)
        WHERE id = ?
      `).run(
        spotifyTrack.id,
        features.energy,
        features.danceability,
        features.valence,
        features.loudness,
        features.key,
        features.energy,
        features.valence,
        track.id
      );

      enriched++;
      process.stdout.write(`✓ ${spotifyTrack.artists[0].name} - ${spotifyTrack.name}\n`);

      // Rate limiting - 50 requests per batch, then pause
      if ((i + 1) % batchSize === 0) {
        console.log(`\n⏸  Batch complete. Pausing for rate limit...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      errors++;
      process.stdout.write(`✗ Error: ${error.message}\n`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('ENRICHMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total processed: ${tracks.length}`);
  console.log(`✓ Enriched: ${enriched} (${((enriched / tracks.length) * 100).toFixed(1)}%)`);
  console.log(`✗ Not found: ${notFound} (${((notFound / tracks.length) * 100).toFixed(1)}%)`);
  console.log(`✗ Errors: ${errors}\n`);

  // Overall stats
  const totalEnriched = db.prepare(`
    SELECT COUNT(*) as count
    FROM audio_tracks
    WHERE user_id = 'default_user' AND spotify_energy IS NOT NULL
  `).get().count;

  const totalTracks = db.prepare(`
    SELECT COUNT(*) as count
    FROM audio_tracks
    WHERE user_id = 'default_user'
  `).get().count;

  const coverage = ((totalEnriched / totalTracks) * 100).toFixed(1);

  console.log('OVERALL LIBRARY COVERAGE');
  console.log('─'.repeat(50));
  console.log(`Spotify data: ${totalEnriched} / ${totalTracks} tracks (${coverage}%)`);

  // Show examples
  if (enriched > 0) {
    console.log('\n\nEXAMPLE ENRICHED TRACKS:');
    console.log('─'.repeat(80));

    const examples = db.prepare(`
      SELECT filename, spotify_energy, spotify_danceability, spotify_valence, spotify_loudness
      FROM audio_tracks
      WHERE spotify_energy IS NOT NULL
      ORDER BY spotify_enriched_at DESC
      LIMIT 5
    `).all();

    examples.forEach((t, i) => {
      console.log(`${i + 1}. ${t.filename}`);
      console.log(`   Energy: ${t.spotify_energy.toFixed(3)} | Dance: ${t.spotify_danceability.toFixed(3)} | Valence: ${t.spotify_valence.toFixed(3)} | Loudness: ${t.spotify_loudness.toFixed(1)} dB\n`);
    });
  }

  if (totalEnriched < totalTracks) {
    const remaining = totalTracks - totalEnriched;
    console.log(`\n💡 Tip: Run again with higher limit to enrich ${remaining} remaining tracks`);
    console.log(`   Example: node enrich_uploads_spotify.js ${Math.min(remaining, 500)}\n`);
  }

  db.close();
}

// Run if called directly
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 100;

  enrichLibrary(limit).catch(error => {
    console.error('\n\n❌ Enrichment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { enrichLibrary };
