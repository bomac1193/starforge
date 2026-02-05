# Enhanced Audio Analysis - Quick Start

Your audio analysis is now supercharged with features from Rebis and Etherfeed! 🎵

---

## What's New

### 1. Deep Audio Analysis
Every track now gets:
- **Quality Score** (0-100%) based on duration, loudness, silence ratio, and tempo confidence
- **Highlight Detection** - automatically finds the best 3 moments in each track
- **Comprehensive features**: BPM, key, energy, valence, spectral features
- **Mood tags**: Automatically generated from audio analysis

### 2. Star Ratings & Preferences
- **Star ratings** (0-5 stars) for each track
- **Quick thumbs** (+1/-1) for rapid curation
- Ratings stored in database for taste profile generation

### 3. Rekordbox Integration
- **Import collection.xml** from Rekordbox
- Extract your star ratings, play counts, and metadata
- **Learn from your DJ library**: See your most played tracks, favorite genres, BPM preferences
- **Taste profile generation**: Understand your musical preferences

### 4. Best Moments Finder
- Automatically detects the best sections within each track
- Three types of highlights:
  - **Energy peaks**: Highest energy moments
  - **Novelty peaks**: Unique, interesting sections
  - **Spectral interest**: Rich frequency content

---

## How to Use

### Upload and Analyze Audio

1. Go to **Twin Genesis** tab
2. Drag & drop MP3/WAV files
3. Click **"Analyze Audio"**
4. Watch the progress modal show:
   - Each track being analyzed
   - Quality scores appearing
   - BPM, key, energy extraction
   - Highlights being detected

### Rate Your Tracks

After analysis, each track shows:
- **Star rating** (click 1-5 stars)
- **Quick thumbs** (👍 or 👎)
- **Quality score** (automatically calculated)
- **Best moments** (expandable highlights section)

### Import Rekordbox Library

1. **Export from Rekordbox:**
   - Open Rekordbox
   - Click "Collection" (not a playlist!)
   - File → Export Collection in xml format
   - Save as `collection.xml`

2. **Import to Starforge:**
   - Scroll to "Rekordbox Integration" panel
   - Drag & drop `collection.xml`
   - Wait for import to complete

3. **View Your Stats:**
   - Total plays
   - Average rating
   - Top genres
   - Most played tracks
   - Highest rated tracks
   - Your taste profile (BPM range, energy preference, diversity score)

---

## API Examples

### Analyze a Single File

```bash
curl -X POST http://localhost:5000/api/audio/upload-and-analyze \
  -F "audio=@my_track.mp3"
```

Response:
```json
{
  "success": true,
  "track": {
    "id": "trk_1234567890",
    "filename": "my_track.mp3",
    "analysis": {
      "bpm": 128,
      "key": "A minor",
      "energy": 0.78,
      "valence": 0.45,
      "qualityScore": 0.87,
      "moodTags": ["energetic", "dark", "driving"]
    },
    "highlights": [
      {
        "startSeconds": 45.2,
        "endSeconds": 55.2,
        "score": 0.92,
        "reason": "energy_peak"
      }
    ]
  }
}
```

### Rate a Track

```bash
# Star rating
curl -X POST http://localhost:5000/api/audio/rate/trk_1234567890 \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Thumbs up/down
curl -X POST http://localhost:5000/api/audio/rate/trk_1234567890 \
  -H "Content-Type: application/json" \
  -d '{"vote": 1}'
```

### Import Rekordbox XML

```bash
curl -X POST http://localhost:5000/api/audio/rekordbox/import-xml \
  -F "xml=@collection.xml"
```

### Get Your Taste Profile

```bash
curl http://localhost:5000/api/audio/taste-profile
```

Response:
```json
{
  "success": true,
  "profile": {
    "preferredBpmRange": { "min": 120, "max": 135 },
    "topGenres": ["House", "Techno", "Drum & Bass"],
    "topKeys": ["A minor", "C major", "D minor"],
    "listeningPatterns": {
      "totalPlays": 15234,
      "avgRating": 3.8,
      "favoriteCount": 156
    },
    "preferences": {
      "highEnergyPreference": 0.72,
      "diversityScore": 0.64
    }
  }
}
```

---

## Database

All data is stored in `backend/starforge_audio.db`:

- **audio_tracks**: Your analyzed tracks with ratings
- **audio_highlights**: Best moments in each track
- **rekordbox_imports**: Import history
- **taste_profiles**: Your generated taste profiles

To inspect:
```bash
cd /home/sphinxy/starforge/backend
sqlite3 starforge_audio.db

# View tracks
SELECT filename, bpm, quality_score, star_rating FROM audio_tracks;

# View highlights
SELECT track_id, start_seconds, end_seconds, reason FROM audio_highlights;
```

---

## What It Learns About You

### From Uploaded Files
- **What you create**: Quality of your recordings
- **Your sound**: Energy levels, valence, BPM patterns
- **Best moments**: What parts of your tracks are strongest

### From Star Ratings
- **What you like**: High-rated tracks define your taste
- **What works**: Quality + rating = best versions

### From Rekordbox Library
- **What you play**: Most played tracks show your favorites
- **Your style**: Genre distribution, BPM sweet spots, key preferences
- **How you DJ**: Color tags, playlists, organization patterns
- **Taste evolution**: Date added, last played timestamps

---

## Next Steps

### Immediate Use
1. Upload 5-10 of your tracks
2. Let them analyze (watch the quality scores!)
3. Rate them with stars
4. Import your Rekordbox library
5. Check your taste profile

### Advanced Use
- Compare different versions of the same track (best version finder coming soon)
- Find patterns across your catalog
- Use highlights to create sample packs from your best moments
- Let the taste profile influence Twin Generation

---

## Troubleshooting

### "Python analysis failed"
Make sure Python dependencies are installed:
```bash
pip3 install librosa numpy scipy
```

### "Rekordbox import failed"
- Make sure you exported the **full collection**, not just a playlist
- File should be `collection.xml`, not a database file

### Quality score seems low
Quality scoring penalizes:
- Very short clips (< 30 seconds)
- Very quiet tracks
- Excessive silence
- Unclear rhythm

These are intentional to help you find the best material!

---

## What's Coming Next

- **Audio embeddings**: CLAP-based similarity search
- **Best version finder**: Automatically rank different takes/versions
- **Pattern visualization**: See your taste on a 2D map
- **Smart recommendations**: "You should listen to this based on your Rekordbox library"
- **Export highlights**: Auto-cut the best moments from tracks

---

**Ready to analyze your creative work!** 🎧

The Twin will now learn from:
- Your actual audio files
- Your ratings and preferences
- Your DJ library patterns
- The highlights you like

This is deep integration. This is real taste learning. 🌌
