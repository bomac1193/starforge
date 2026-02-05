# Enhanced Audio Analysis System

## Overview

Starforge's enhanced audio analysis combines the best parts of Rebis and Etherfeed to create a sophisticated taste-learning system that analyzes your audio files, learns from your preferences, and helps you find the best moments in your creative work.

---

## Features

### 1. Deep Audio Analysis
- **API-based analysis** using Essentia (open-source audio analysis)
- **Quality scoring** based on:
  - Duration (penalize very short clips)
  - Loudness (penalize very quiet tracks)
  - Silence ratio (penalize excessive silence)
  - Tempo confidence (reward clear rhythm)
  - Spectral features (brightness, rolloff, etc.)
- **Highlight extraction**: Identify the best moments/sections within tracks
- **Audio embeddings**: CLAP-based similarity search

### 2. High-Signal Input from You
- **Star ratings** (1-5 stars) for each track
- **Quick rating** (+1/-1 thumbs up/down)
- **Best/Worst tags** for rapid curation
- **Highlight markers**: Mark specific sections you like
- **Listening patterns**: Track play counts, skip rates

### 3. Rekordbox Integration
- **Import collection.xml** from Rekordbox
- **Extract metadata**:
  - Your star ratings (0-5)
  - Play counts
  - Date added, last played
  - BPM, key, comments
  - Color tags, playlists
- **Learn preferences**: What you play most, what you rate highest
- **Genre/tag analysis**: Understand your taste clusters

### 4. Intelligent Pattern Recognition
- **Most played genres/styles**
- **Energy/valence preferences**
- **BPM sweet spots**
- **Key preferences**
- **Time-of-day patterns** (if timestamp data available)
- **Evolution over time**: How your taste changes

### 5. Best Version Finder
Rank similar tracks/recordings using:
- **Similarity** (50%): Audio embedding cosine similarity
- **Rating** (30%): User star ratings or +1/-1
- **Quality** (20%): Heuristic quality score

---

## API Endpoints

### Audio Analysis
```
POST /api/audio/upload-and-analyze
  - Upload audio file
  - Analyze with Essentia
  - Extract quality score
  - Detect highlights
  - Generate audio embedding
  - Return: Full analysis + highlights

POST /api/audio/analyze-batch
  - Upload multiple files
  - Analyze in parallel
  - Return: Array of analyses

GET /api/audio/highlights/{trackId}
  - Get the best moments/sections from a track
  - Return: Array of { start, end, score, reason }
```

### Ratings & Preferences
```
POST /api/audio/rate/{trackId}
  - Body: { rating: 1-5 } or { vote: +1/-1 }
  - Update track rating
  - Recalculate taste profile

GET /api/audio/taste-profile
  - Get your overall musical taste profile
  - Return: Preferred BPM range, energy, genres, etc.

GET /api/audio/similar/{trackId}
  - Find similar tracks based on embeddings
  - Return: Ranked list of similar tracks

POST /api/audio/find-best-version
  - Body: { trackIds: [...] }
  - Rank versions using similarity + rating + quality
  - Return: Ranked array with scores
```

### Rekordbox Integration
```
POST /api/rekordbox/import-xml
  - Upload collection.xml
  - Parse all tracks, ratings, play counts
  - Store in database
  - Return: { imported: 1234, errors: 0 }

GET /api/rekordbox/stats
  - Get statistics from your Rekordbox library
  - Return: Top played, top rated, genre distribution, etc.

GET /api/rekordbox/listening-patterns
  - Analyze your play counts and ratings
  - Return: Energy preferences, BPM ranges, key preferences
```

---

## Database Schema

### `audio_tracks` Table
```sql
CREATE TABLE audio_tracks (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration_seconds REAL,

  -- Analysis results
  bpm REAL,
  key TEXT,
  energy REAL,
  valence REAL,
  loudness REAL,
  silence_ratio REAL,
  tempo_confidence REAL,

  -- Quality score
  quality_score REAL,
  quality_breakdown JSON, -- { duration_score, loudness_score, etc. }

  -- User input
  star_rating INTEGER, -- 0-5
  thumbs INTEGER, -- +1, 0, -1
  is_favorite BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,

  -- Audio embedding (768-dim vector for CLAP)
  embedding BLOB,

  -- Metadata
  source TEXT, -- 'upload', 'rekordbox', 'folder_scan'
  uploaded_at TIMESTAMP,
  last_played_at TIMESTAMP,

  -- Rekordbox specific
  rekordbox_id TEXT,
  rekordbox_play_count INTEGER,
  rekordbox_star_rating INTEGER,
  rekordbox_color TEXT,
  rekordbox_comments TEXT
);
```

### `audio_highlights` Table
```sql
CREATE TABLE audio_highlights (
  id TEXT PRIMARY KEY,
  track_id TEXT REFERENCES audio_tracks(id),

  -- Time range
  start_seconds REAL NOT NULL,
  end_seconds REAL NOT NULL,

  -- Scoring
  highlight_score REAL,
  reason TEXT, -- 'peak_energy', 'unique_section', 'user_marked'

  -- User input
  user_marked BOOLEAN DEFAULT FALSE,
  user_rating INTEGER, -- Can rate individual sections

  created_at TIMESTAMP
);
```

### `rekordbox_imports` Table
```sql
CREATE TABLE rekordbox_imports (
  id TEXT PRIMARY KEY,
  imported_at TIMESTAMP,
  total_tracks INTEGER,
  successful_imports INTEGER,
  failed_imports INTEGER,
  xml_file_path TEXT
);
```

---

## Quality Scoring Algorithm

```python
def calculate_quality_score(analysis):
    scores = {}

    # 1. Duration score (penalize very short clips)
    duration = analysis['duration']
    if duration < 10:
        scores['duration'] = 0.3
    elif duration < 30:
        scores['duration'] = 0.6
    elif duration < 60:
        scores['duration'] = 0.8
    else:
        scores['duration'] = 1.0

    # 2. Loudness score (penalize very quiet tracks)
    loudness = analysis['loudness']  # in dB
    if loudness < -30:
        scores['loudness'] = 0.4
    elif loudness < -20:
        scores['loudness'] = 0.7
    else:
        scores['loudness'] = 1.0

    # 3. Silence ratio score (penalize excessive silence)
    silence_ratio = analysis['silence_ratio']
    scores['silence'] = 1.0 - min(silence_ratio, 1.0)

    # 4. Tempo confidence (reward clear rhythm)
    tempo_conf = analysis.get('tempo_confidence', 0.5)
    scores['tempo'] = tempo_conf

    # Weighted average
    quality = (
        scores['duration'] * 0.25 +
        scores['loudness'] * 0.25 +
        scores['silence'] * 0.25 +
        scores['tempo'] * 0.25
    )

    return {
        'overall': quality,
        'breakdown': scores
    }
```

---

## Highlight Detection

Extract the best moments from a track:

1. **Energy peaks**: Find sections with highest energy
2. **Novelty detection**: Find sections that are unique
3. **Spectral contrast**: Find moments with interesting frequency content
4. **User markers**: Allow manual highlight creation

```python
def detect_highlights(audio_path, num_highlights=3):
    # Load audio
    y, sr = librosa.load(audio_path)

    # Calculate frame-level features
    energy = librosa.feature.rms(y=y)[0]
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    novelty = librosa.onset.onset_strength(y=y, sr=sr)

    # Find peaks
    energy_peaks = find_peaks(energy, n=num_highlights)
    novelty_peaks = find_peaks(novelty, n=num_highlights)

    # Combine and rank
    highlights = []
    for peak_frame in energy_peaks + novelty_peaks:
        start_time = librosa.frames_to_time(peak_frame, sr=sr)
        highlights.append({
            'start': start_time,
            'end': start_time + 10,  # 10-second highlight
            'score': energy[peak_frame],
            'reason': 'energy_peak' or 'novelty_peak'
        })

    return sorted(highlights, key=lambda x: x['score'], reverse=True)
```

---

## Rekordbox XML Parser

Parse Rekordbox collection.xml:

```python
import xml.etree.ElementTree as ET

def parse_rekordbox_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    tracks = []
    for track_elem in root.findall('.//TRACK'):
        track = {
            'rekordbox_id': track_elem.get('TrackID'),
            'title': track_elem.get('Name'),
            'artist': track_elem.get('Artist'),
            'album': track_elem.get('Album'),
            'genre': track_elem.get('Genre'),
            'bpm': float(track_elem.get('AverageBpm', 0)),
            'key': track_elem.get('Tonality'),
            'duration': int(track_elem.get('TotalTime', 0)),

            # User data
            'star_rating': int(track_elem.get('Rating', 0)),
            'play_count': int(track_elem.get('PlayCount', 0)),
            'color': track_elem.get('Colour'),
            'comments': track_elem.get('Comments'),

            # File path
            'file_path': track_elem.get('Location', '').replace('file://localhost/', '/'),

            # Dates
            'date_added': track_elem.get('DateAdded'),
            'last_played': track_elem.get('LastPlayed'),
        }
        tracks.append(track)

    return tracks
```

---

## Taste Profile Generation

Learn from ratings and listening patterns:

```python
def generate_taste_profile(tracks):
    # Filter to highly rated/played tracks
    favorites = [t for t in tracks if t['star_rating'] >= 4 or t['play_count'] > 10]

    profile = {
        'preferred_bpm_range': calculate_percentile_range([t['bpm'] for t in favorites], 25, 75),
        'avg_energy': avg([t['energy'] for t in favorites]),
        'avg_valence': avg([t['valence'] for t in favorites]),
        'top_keys': most_common([t['key'] for t in favorites], n=3),
        'top_genres': most_common([t['genre'] for t in favorites], n=5),

        'listening_patterns': {
            'total_plays': sum([t['play_count'] for t in tracks]),
            'most_played': sorted(tracks, key=lambda t: t['play_count'], reverse=True)[:10],
            'highest_rated': sorted(tracks, key=lambda t: t['star_rating'], reverse=True)[:10],
        }
    }

    return profile
```

---

## Frontend Components

### 1. Rekordbox Import Panel
```jsx
<div className="card">
  <h3>Import Rekordbox Library</h3>
  <p className="text-muted">
    Upload your collection.xml to learn from your star ratings and play counts
  </p>

  <Dropzone onDrop={handleRekordboxUpload}>
    Drop collection.xml here
  </Dropzone>

  {importStatus && (
    <div>
      <p>✓ Imported {importStatus.imported} tracks</p>
      <p>Top genres: {importStatus.topGenres.join(', ')}</p>
      <p>Most played: {importStatus.mostPlayed}</p>
    </div>
  )}
</div>
```

### 2. Track Rating Component
```jsx
<div className="track-rating">
  <StarRating
    value={track.starRating}
    onChange={(rating) => rateTrack(track.id, rating)}
  />
  <div className="quick-actions">
    <button onClick={() => voteTrack(track.id, +1)}>👍</button>
    <button onClick={() => voteTrack(track.id, -1)}>👎</button>
  </div>
</div>
```

### 3. Highlight Viewer
```jsx
<div className="highlights">
  <h4>Best Moments</h4>
  {track.highlights.map(h => (
    <div className="highlight-item">
      <span>{formatTime(h.start)} - {formatTime(h.end)}</span>
      <span className="reason">{h.reason}</span>
      <button onClick={() => playHighlight(h)}>▶ Play</button>
      <button onClick={() => rateHighlight(h.id, +1)}>👍</button>
    </div>
  ))}
</div>
```

---

## Implementation Plan

### Phase 1: Core Analysis (Week 1)
- [ ] Set up Essentia audio analysis
- [ ] Implement quality scoring algorithm
- [ ] Create audio_tracks database table
- [ ] Build basic analysis API endpoints

### Phase 2: Ratings & Highlights (Week 2)
- [ ] Add star rating system
- [ ] Implement highlight detection
- [ ] Create audio_highlights table
- [ ] Build rating API endpoints

### Phase 3: Rekordbox Integration (Week 3)
- [ ] Build XML parser
- [ ] Create import endpoint
- [ ] Extract listening patterns
- [ ] Generate taste profile

### Phase 4: Best Version Finder (Week 4)
- [ ] Implement CLAP embeddings
- [ ] Build similarity search
- [ ] Create ranking algorithm
- [ ] Add frontend visualizations

---

## Dependencies

```json
{
  "backend": {
    "essentia": "Audio analysis",
    "librosa": "Audio processing",
    "clap-embeddings": "Audio embeddings for similarity",
    "numpy": "Numerical operations",
    "scipy": "Signal processing"
  },
  "frontend": {
    "react-dropzone": "File uploads",
    "wavesurfer.js": "Audio waveform visualization",
    "react-star-ratings": "Star rating component"
  }
}
```

---

## Next Steps

1. Install Essentia and librosa in backend
2. Create enhanced SINK service with quality scoring
3. Build Rekordbox XML parser
4. Add rating system to frontend
5. Implement highlight detection

This will transform Starforge's audio analysis from basic mood detection to a comprehensive taste-learning system that understands what you like and helps you find the best moments in your creative work.
