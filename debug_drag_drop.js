#!/usr/bin/env node
/**
 * Drag & Drop Debug Tool
 * Tests audio upload and Rekordbox XML import endpoints
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Create a minimal test XML
function createTestXML() {
  const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <PRODUCT Name="rekordbox" Version="6.0.0"/>
  <COLLECTION Entries="3">
    <TRACK TrackID="1" Name="Test Track 1" Artist="Test Artist" Album="Test Album"
           Genre="House" AverageBpm="128.00" Tonality="Am" TotalTime="240"
           Rating="4" PlayCount="5" Colour="Pink" Location="file://localhost/Music/track1.mp3"/>
    <TRACK TrackID="2" Name="Test Track 2" Artist="Test Artist" Album="Test Album"
           Genre="Techno" AverageBpm="135.00" Tonality="Dm" TotalTime="300"
           Rating="5" PlayCount="10" Location="file://localhost/Music/track2.mp3"/>
    <TRACK TrackID="3" Name="Test Track 3" Artist="Test Artist" Album="Test Album"
           Genre="House" AverageBpm="124.00" Tonality="Gm" TotalTime="280"
           Rating="3" PlayCount="2" Location="file://localhost/Music/track3.mp3"/>
  </COLLECTION>
  <PLAYLISTS/>
</DJ_PLAYLISTS>`;

  const testDir = path.join(__dirname, 'backend/test_rekordbox');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const xmlPath = path.join(testDir, 'test_collection.xml');
  fs.writeFileSync(xmlPath, testXML);

  return xmlPath;
}

async function testAudioUpload() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('TEST 1: Audio File Upload', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  // Check for test audio files
  const testAudioDir = path.join(__dirname, 'backend/test_audio');

  if (!fs.existsSync(testAudioDir)) {
    log('\n⚠  No test_audio directory found', 'yellow');
    log(`   Create directory and add audio files: ${testAudioDir}`, 'yellow');
    return;
  }

  const audioFiles = fs.readdirSync(testAudioDir)
    .filter(f => /\.(mp3|wav|m4a|flac|ogg)$/i.test(f))
    .slice(0, 2);

  if (audioFiles.length === 0) {
    log('\n⚠  No audio files found in test_audio', 'yellow');
    log('   Supported formats: MP3, WAV, M4A, FLAC, OGG', 'yellow');
    return;
  }

  log(`\nFound ${audioFiles.length} test file(s)`, 'green');

  for (const file of audioFiles) {
    const filePath = path.join(testAudioDir, file);
    const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);

    log(`\n[Testing] ${file} (${fileSize} MB)`, 'blue');

    try {
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(filePath));

      log('  → Sending to /api/audio/upload-and-analyze...', 'yellow');

      const response = await axios.post(
        `${API_BASE}/audio/upload-and-analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      if (response.data.success) {
        const track = response.data.track;
        log('  ✓ Upload successful', 'green');
        log(`    Track ID: ${track.id}`, 'green');
        log(`    BPM: ${track.analysis.bpm.toFixed(1)}`, 'green');
        log(`    Key: ${track.analysis.key}`, 'green');
        log(`    Quality: ${(track.analysis.qualityScore * 100).toFixed(1)}%`, 'green');
        log(`    Energy: ${(track.analysis.energy * 100).toFixed(1)}%`, 'green');
      } else {
        log('  ✗ Upload failed', 'red');
        log(`    Error: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log('  ✗ Request failed', 'red');
      if (error.response) {
        log(`    HTTP ${error.response.status}: ${error.response.statusText}`, 'red');
        log(`    Error: ${error.response.data?.error || 'Unknown error'}`, 'red');
      } else if (error.code === 'ECONNREFUSED') {
        log('    Server not running! Start with: cd backend && npm start', 'red');
      } else {
        log(`    ${error.message}`, 'red');
      }
    }
  }
}

async function testRekordboxImport() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('TEST 2: Rekordbox XML Import', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  // Try to find existing XML or create test XML
  let xmlPath = path.join(__dirname, 'backend/test_rekordbox/collection.xml');

  if (!fs.existsSync(xmlPath)) {
    log('\n⚠  No collection.xml found', 'yellow');
    log('   Creating test XML...', 'yellow');
    xmlPath = createTestXML();
    log(`   ✓ Created: ${xmlPath}`, 'green');
  }

  const fileSize = (fs.statSync(xmlPath).size / 1024).toFixed(2);
  log(`\n[Testing] collection.xml (${fileSize} KB)`, 'blue');

  try {
    const formData = new FormData();
    formData.append('xml', fs.createReadStream(xmlPath));

    log('  → Sending to /api/audio/rekordbox/import-xml...', 'yellow');

    const response = await axios.post(
      `${API_BASE}/audio/rekordbox/import-xml`,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    if (response.data.success) {
      const importData = response.data.import;
      log('  ✓ Import successful', 'green');
      log(`    Total tracks: ${importData.totalTracks}`, 'green');
      log(`    Imported: ${importData.imported}`, 'green');
      log(`    Failed: ${importData.failed}`, 'green');

      if (importData.stats?.topGenres) {
        log('\n    Top Genres:', 'green');
        importData.stats.topGenres.slice(0, 3).forEach(g => {
          log(`      - ${g.genre} (${g.count} tracks)`, 'green');
        });
      }

      if (importData.tasteProfile?.preferredBpmRange) {
        const bpm = importData.tasteProfile.preferredBpmRange;
        log(`\n    BPM Range: ${bpm.min.toFixed(0)}-${bpm.max.toFixed(0)}`, 'green');
      }
    } else {
      log('  ✗ Import failed', 'red');
      log(`    Error: ${response.data.error}`, 'red');
    }
  } catch (error) {
    log('  ✗ Request failed', 'red');
    if (error.response) {
      log(`    HTTP ${error.response.status}: ${error.response.statusText}`, 'red');
      log(`    Error: ${error.response.data?.error || 'Unknown error'}`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log('    Server not running! Start with: cd backend && npm start', 'red');
    } else {
      log(`    ${error.message}`, 'red');
    }
  }
}

async function checkEndpoints() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('Checking API Endpoints', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const endpoints = [
    { url: '/health', method: 'GET', name: 'Health Check' },
    { url: '/deep/audio/sonic-palette', method: 'GET', name: 'Sonic Palette' },
    { url: '/deep/audio/taste-coherence', method: 'GET', name: 'Taste Coherence' },
  ];

  for (const endpoint of endpoints) {
    try {
      log(`\n[${endpoint.name}] ${endpoint.method} ${endpoint.url}`, 'blue');

      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: `${API_BASE}${endpoint.url}`,
        validateStatus: () => true
      });

      if (response.status === 200 || response.status === 404) {
        if (response.data.success === true) {
          log('  ✓ Endpoint working', 'green');
        } else if (response.data.success === false) {
          log(`  ⚠  Endpoint working but returned error: ${response.data.error}`, 'yellow');
        } else {
          log('  ✓ Endpoint accessible', 'green');
        }
      } else {
        log(`  ⚠  HTTP ${response.status}`, 'yellow');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log('  ✗ Server not running', 'red');
        break;
      } else {
        log(`  ✗ ${error.message}`, 'red');
      }
    }
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║   AUDIO DNA - Drag & Drop Debug Tool              ║', 'blue');
  log('╚════════════════════════════════════════════════════╝', 'blue');

  await checkEndpoints();
  await testAudioUpload();
  await testRekordboxImport();

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('Debug Complete', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  log('Frontend Debugging Tips:', 'yellow');
  log('1. Open browser console (F12)', 'yellow');
  log('2. Go to Network tab', 'yellow');
  log('3. Try drag & drop', 'yellow');
  log('4. Check for failed requests', 'yellow');
  log('5. Look for CORS errors', 'yellow');
  log('\nCommon issues:', 'yellow');
  log('- Server not running (start with: cd backend && npm start)', 'yellow');
  log('- Frontend not running (start with: cd frontend && npm start)', 'yellow');
  log('- CORS issues (check if API_BASE URL matches)', 'yellow');
  log('- File type restrictions in dropzone config', 'yellow');
  log('- File size limits (check multer config)', 'yellow');
}

main().catch(console.error);
