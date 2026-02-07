#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

async function testSpotify() {
  console.log('🔑 Testing Spotify API credentials...\n');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('❌ Missing credentials in .env file');
    process.exit(1);
  }

  // Get access token
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
    console.log('❌ Authentication failed:', response.status, response.statusText);
    const error = await response.text();
    console.log('Error:', error);
    process.exit(1);
  }

  const data = await response.json();
  console.log('✅ Spotify API authentication successful!');
  console.log(`   Token type: ${data.token_type}`);
  console.log(`   Expires in: ${data.expires_in} seconds\n`);

  // Test a search query
  const searchResponse = await fetch('https://api.spotify.com/v1/search?q=Kill%20The%20Noise&type=track&limit=1', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`
    }
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.tracks.items.length > 0) {
      console.log('✅ Search API test successful!');
      console.log(`   Found: "${searchData.tracks.items[0].name}" by ${searchData.tracks.items[0].artists[0].name}\n`);
    }
  }

  console.log('🎵 Ready to enrich your library with Spotify audio features!');
}

testSpotify().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
