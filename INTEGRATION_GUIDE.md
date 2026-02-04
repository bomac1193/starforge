# 🔌 Starforge Integration Guide

## CLAROSA + SINK Integration Complete

This guide explains how Starforge now connects to your existing creative infrastructure.

---

## 🎨 Architecture Overview

```
┌──────────────────────────────────────────┐
│        STARFORGE (Twin OS Hub)           │
│         http://localhost:3001            │
└──────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌─────────┐
│ CLAROSA │      │  SINK   │
│ Visual  │      │ Audio   │
│ Catalog │      │ Analysis│
└─────────┘      └─────────┘
```

---

## 🎨 CLAROSA Integration (Visual DNA)

### What It Does
- Connects to your CLAROSA photo curation system
- Pulls top-rated images (Bradley-Terry scores > 0.7)
- Extracts color palettes and aesthetic tags
- Generates "visual tone" description for Twin

### API Endpoints

#### GET `/api/clarosa/visual-essence`
Fetches visual DNA from CLAROSA

**Query Params:**
- `limit` (optional): Number of images (default: 10)
- `min_score` (optional): Minimum BT score (default: 0.7)

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": 1,
      "path": "/clarosa/images/sample.jpg",
      "score": 0.85,
      "confidence": 0.92,
      "colorPalette": ["#A882FF", "#26FFE6"],
      "tags": ["abstract", "neon", "cosmic"]
    }
  ],
  "visualTone": {
    "dominantColors": ["#A882FF", "#26FFE6", "#0F0F1A"],
    "aestheticTags": ["abstract", "neon", "cosmic", "dark"],
    "styleDescription": "abstract, neon, cosmic aesthetic with neon lavender, electric mint tones",
    "confidence": 0.85,
    "imageCount": 10
  }
}
```

#### GET `/api/clarosa/taste-profile`
Gets user's overall visual taste profile from CLAROSA

#### POST `/api/clarosa/import-midjourney`
Import Midjourney exports into CLAROSA for ranking

**Body:**
```json
{
  "mjExportPath": "/path/to/midjourney/export"
}
```

### Frontend Usage

```jsx
// In TwinGenesisPanelEnhanced.js

const handleConnectClarosa = async () => {
  const response = await axios.get('/api/clarosa/visual-essence', {
    params: { limit: 10, min_score: 0.7 }
  });

  if (response.data.success) {
    // Display visual tone
    console.log(response.data.visualTone.styleDescription);
    // Show color palette
    response.data.visualTone.dominantColors.forEach(color => {
      // Render color swatches
    });
  }
};
```

---

## 🎵 SINK Integration (Audio DNA)

### What It Does
- Analyzes audio files for mood, energy, and musical features
- Uses Essentia for feature extraction
- Generates "audio DNA" profile from multiple tracks
- Provides BPM, key, valence, energy scores

### API Endpoints

#### POST `/api/sink/analyze`
Analyze single audio file

**Form Data:**
- `audio`: Audio file (.mp3, .wav)

**Response:**
```json
{
  "success": true,
  "analysis": {
    "energy": 0.75,
    "valence": 0.6,
    "arousal": 0.7,
    "danceability": 0.8,
    "bpm": 128,
    "key": "A minor",
    "mode": "minor",
    "moodTags": ["energetic", "dark", "driving"],
    "genreHints": ["techno", "house"],
    "confidence": 0.65
  },
  "filename": "track.mp3"
}
```

#### POST `/api/sink/analyze-batch`
Analyze multiple audio files

**Form Data:**
- `audio[]`: Array of audio files

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "filename": "track1.mp3",
      "analysis": { /* mood data */ }
    }
  ],
  "audioDNA": {
    "profile": "high-energy techno with dark and driving vibes around 128 BPM",
    "features": {
      "avgEnergy": 0.78,
      "avgValence": 0.55,
      "avgBpm": 128,
      "energyCategory": "high-energy",
      "moodCategory": "dark",
      "dominantMoods": ["energetic", "dark", "driving"],
      "dominantGenres": ["techno", "house"]
    },
    "trackCount": 5,
    "confidence": 1.0
  }
}
```

#### POST `/api/sink/separate-stems`
Separate audio into stems (vocals, drums, bass, other)

**Form Data:**
- `audio`: Audio file

**Response:**
```json
{
  "success": true,
  "stems": {
    "vocals": "/path/to/vocals.wav",
    "drums": "/path/to/drums.wav",
    "bass": "/path/to/bass.wav",
    "other": "/path/to/other.wav"
  }
}
```

### Frontend Usage

```jsx
// In TwinGenesisPanelEnhanced.js

const handleAnalyzeAudio = async () => {
  const formData = new FormData();
  audioFiles.forEach(file => {
    formData.append('audio', file);
  });

  const response = await axios.post('/api/sink/analyze-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  if (response.data.success) {
    // Display audio DNA
    console.log(response.data.audioDNA.profile);
    // Show features: BPM, energy, valence, moods
  }
};
```

---

## 🌌 Enhanced Twin Generation

### POST `/api/twin/generate-enhanced`

Generates Twin OS using both CLAROSA and SINK data.

**Form Data:**
- `audio[]`: Audio files for analysis
- `caption`: Sample caption text
- `bio`: Artist bio
- `glowLevel`: Energy level (1-5)

**Response:**
```json
{
  "success": true,
  "twinData": {
    "voiceSample": "Sample caption text...",
    "bio": "Artist bio text",

    "visualTone": "abstract, neon, cosmic aesthetic with neon lavender tones",
    "colorPalette": ["#A882FF", "#26FFE6", "#0F0F1A"],
    "aestheticTags": ["abstract", "neon", "cosmic"],
    "visualConfidence": 0.85,

    "audioProfile": "high-energy techno with dark vibes around 128 BPM",
    "audioFeatures": {
      "avgEnergy": 0.78,
      "avgBpm": 128,
      "dominantMoods": ["energetic", "dark"]
    },
    "audioConfidence": 1.0,

    "capacityScore": "high",
    "personality": {
      "tone": "poetic",
      "style": "mythic",
      "energyLevel": 4
    },

    "generatedAt": "2026-02-04T...",
    "sources": {
      "visual": "clarosa",
      "audio": "sink"
    }
  }
}
```

---

## 🖥️ Frontend UI

### Quick Sync Panel

Located in Twin Genesis, users see:

```
┌─ Quick Sync ─────────────────────┐
│                                   │
│  [🎨 Connect CLAROSA]             │
│      Visual Catalog               │
│                                   │
│  [🎵 Analyze Audio]               │
│      SINK Mood Analysis           │
│                                   │
└───────────────────────────────────┘
```

**After Connecting CLAROSA:**
```
✓ CLAROSA Connected

Visual Tone: abstract, neon, cosmic aesthetic
Colors: [#A882FF] [#26FFE6] [#0F0F1A]
```

**After Analyzing Audio:**
```
✓ Audio Analyzed

Audio Profile: high-energy techno with dark vibes
Energy: 78% | Valence: 55% | BPM: 128 | Tracks: 5
```

---

## 🚀 Usage Flow

### For Artists

1. **Open Starforge** → http://localhost:3001

2. **Twin Genesis Panel**

3. **Connect CLAROSA**
   - Click "Connect CLAROSA" button
   - Visual essence auto-imported
   - See color palette + style description

4. **Upload Audio**
   - Drag & drop MP3/WAV files
   - Click "Analyze Audio"
   - SINK extracts mood + BPM + key

5. **Add Voice**
   - Write sample caption
   - Write bio

6. **Set Glow Level**
   - Slide 1-5 based on current energy

7. **Generate Twin OS**
   - Combines all data
   - Creates artist DNA profile
   - Ready for Ritual Engine

---

## 🔧 Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# CLAROSA Integration
CLAROSA_URL=http://localhost:8000
CLAROSA_PATH=/home/sphinxy/clarosa

# SINK Integration
SINK_URL=http://localhost:8001
SINK_PATH=/home/sphinxy/SINK
PYTHON_PATH=python3
```

### Starting Services

If CLAROSA and SINK have their own servers:

```bash
# Terminal 1: CLAROSA
cd ~/clarosa
python -m uvicorn main:app --port 8000

# Terminal 2: SINK
cd ~/SINK
python -m uvicorn main:app --port 8001

# Terminal 3: Starforge Backend
cd ~/starforge/backend
npm run dev

# Terminal 4: Starforge Frontend
cd ~/starforge/frontend
npm start
```

---

## 🧪 Testing the Integration

### Test CLAROSA Connection

```bash
curl http://localhost:5000/api/clarosa/visual-essence?limit=5
```

**Expected Response:**
- List of top-rated images
- Visual tone description
- Color palette
- Aesthetic tags

### Test SINK Analysis

```bash
curl -X POST http://localhost:5000/api/sink/analyze \
  -F "audio=@/path/to/track.mp3"
```

**Expected Response:**
- Mood features (energy, valence, arousal)
- Musical features (BPM, key, mode)
- Mood tags and genre hints

### Test Enhanced Twin Generation

```bash
curl -X POST http://localhost:5000/api/twin/generate-enhanced \
  -F "audio=@/path/to/track.mp3" \
  -F "caption=My sample caption" \
  -F "bio=Artist bio" \
  -F "glowLevel=4"
```

**Expected Response:**
- Complete Twin profile with visual + audio DNA

---

## 🛠️ Troubleshooting

### CLAROSA Unavailable

If CLAROSA isn't running, Starforge will:
- Use fallback visual data
- Still function with manual uploads
- Show warning: "CLAROSA unavailable, using fallback"

**Fallback visual tone:**
```json
{
  "styleDescription": "Cosmic neon aesthetic",
  "dominantColors": ["#A882FF", "#26FFE6"],
  "confidence": 0.5
}
```

### SINK Unavailable

If SINK isn't running:
- Starforge will show warning
- Use fallback audio profile
- Still function with basic Twin generation

**Fallback audio profile:**
```json
{
  "profile": "High-energy electronic with driving beats",
  "confidence": 0.5
}
```

### Checking Service Status

```bash
# Check CLAROSA
curl http://localhost:8000/health

# Check SINK
curl http://localhost:8001/health

# Check Starforge
curl http://localhost:5000/api/health
```

---

## 🔮 Future Enhancements

### Phase 2: Direct Database Access

Instead of API calls, query CLAROSA/SINK databases directly:

```javascript
// In clarosaService.js
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'clarosa',
  user: 'user',
  password: 'pass'
});

const images = await client.query(`
  SELECT * FROM images
  WHERE bradley_terry_score > 0.7
  ORDER BY score DESC
  LIMIT 10
`);
```

### Phase 3: Real-time Sync

WebSocket connection to CLAROSA for live updates:

```javascript
// When user ranks new image in CLAROSA
// Starforge Twin instantly updates
```

### Phase 4: Midjourney Direct Integration

```javascript
// Connect to Midjourney API directly
const mjImages = await midjourney.getRecentGenerations();
// Auto-import to CLAROSA
// Auto-update Twin visual DNA
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       │ Clicks "Connect CLAROSA"
       ▼
┌──────────────────────────┐
│ TwinGenesisPanelEnhanced │
└──────────┬───────────────┘
           │
           │ GET /api/clarosa/visual-essence
           ▼
┌──────────────────────┐
│ clarosaService.js    │
└──────────┬───────────┘
           │
           │ Try API call to CLAROSA
           ▼
┌──────────────────────┐
│ CLAROSA              │
│ http://localhost:8000│
└──────────┬───────────┘
           │
           │ Returns top-rated images
           ▼
┌──────────────────────┐
│ Extract Visual Tone  │
│ - Color analysis     │
│ - Tag frequency      │
│ - Style description  │
└──────────┬───────────┘
           │
           │ Returns to Frontend
           ▼
┌──────────────────────┐
│ Display in UI:       │
│ - Color swatches     │
│ - Style description  │
│ - Confidence score   │
└──────────────────────┘
```

---

## 🎯 Summary

**What's Integrated:**
- ✅ CLAROSA visual catalog connection
- ✅ SINK audio analysis
- ✅ Enhanced Twin generation combining both
- ✅ Fallback system if services unavailable
- ✅ Color palette extraction from CLAROSA
- ✅ Mood/BPM/key detection from SINK
- ✅ Batch audio analysis
- ✅ Twin profile with confidence scores

**Next Steps:**
1. Start CLAROSA service (if separate)
2. Start SINK service (if separate)
3. Test integration via Starforge UI
4. Generate Twin with full DNA profile

**The Twin now learns from your entire creative universe.** 🌌
