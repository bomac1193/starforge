# Starforge Changelog

## [0.2.0] - 2026-02-04 - Deep Integration Release

### 🔥 Major Features

#### Deep CLAROSA Integration
- **Direct database access** to CLAROSA SQLite database
- Show user's **actual photos** with real Bradley-Terry scores
- Extract **visual DNA** from user's curated collection
- Get **curation categories** (highlight, keep, review, delete)
- Display real **taste profile** with confidence scores

**New Endpoints:**
- `GET /api/deep/clarosa/profile` - Real user profile & stats
- `GET /api/deep/clarosa/top-photos` - Actual top-rated photos
- `GET /api/deep/clarosa/visual-dna` - Complete visual DNA extraction
- `GET /api/deep/clarosa/curation` - Photos grouped by category

#### SINK Folder Scanner
- **Recursive folder scanning** for audio files (1000+ tracks)
- **Batch analysis** with configurable parallelism
- **Pattern recognition** across entire catalog
- **Style clustering** (high-energy, chill, dark, uplifting, ambient)
- **Deep insights** (BPM distribution, key distribution, mood frequency)

**New Endpoints:**
- `POST /api/deep/sink/scan-folder` - Scan music directory
- `POST /api/deep/sink/analyze-catalog` - Batch analyze entire catalog
- `GET /api/deep/sink/analysis-status` - Check progress
- `GET /api/deep/sink/pattern-analysis` - Get deep musical DNA
- `POST /api/deep/sink/generate-music` - (Architecture ready for AudioCraft)

#### Enhanced Twin Generation
- **Complete Twin profile** combining visual + audio DNA
- Real confidence scores from Bradley-Terry model
- Actual user data instead of fallbacks

**New Endpoint:**
- `POST /api/deep/twin/generate-complete` - Full Twin with deep integration

### 🛠️ Technical Improvements

**Backend:**
- Added `better-sqlite3` for direct database access
- Created `clarosaServiceDirect.js` - Direct CLAROSA DB queries
- Created `sinkFolderScanner.js` - Recursive audio file scanner with pattern analysis
- New routes in `/api/deep/` namespace
- EventEmitter-based progress tracking for async scans

**Performance:**
- Direct DB queries (faster than HTTP API calls)
- Batch processing with configurable parallelism
- Async folder scanning with progress events
- Limited concurrency to prevent memory issues

**Data Flow:**
```
Starforge → CLAROSA DB (SQLite) → Real photos + scores
Starforge → Music Folder → SINK Analysis → Pattern Recognition → Musical DNA
```

### 📊 Real Data Integration

**CLAROSA Stats (Example User):**
- 199 photos analyzed
- 58 highlights (≥80% score)
- 69 keep (60-80% score)
- 17 delete candidates (≤35% score)
- Average score: 67%

**Pattern Analysis Capabilities:**
- Energy distribution (low/medium/high)
- Valence distribution (dark/neutral/uplifting)
- BPM distribution (slow/moderate/fast/very fast)
- Key distribution (top 10 keys)
- Mood tag frequency (top 15 moods)
- Style clusters with feature averages
- Overall style summary

### 📚 Documentation

**New Guides:**
- `DEEP_INTEGRATION.md` - Complete API reference for deep integration
- `CHANGELOG.md` - This file

**Updated:**
- `INTEGRATION_GUIDE.md` - Enhanced with deep integration context
- `README.md` - Updated feature list

### 🐛 Bug Fixes

- Fixed CLAROSA service to handle single-user system (no user_id in photos)
- Fixed score normalization (0-1 scale → 0-100 for display)
- Added proper error handling for missing databases
- Fixed tag parsing (JSON vs array)

### 🔮 Architecture for Future

**Music Generation Ready:**
- Service structure prepared for AudioCraft integration
- Pattern analysis provides training data for style matching
- Endpoint placeholder: `POST /api/deep/sink/generate-music`

**Integration Points:**
```javascript
// Future: Generate music based on user's catalog
const patterns = sinkFolderScanner.generatePatternAnalysis(results);
const generatedTrack = await audiocraft.generate({
  style: patterns.overallStyle,
  energy: patterns.avgEnergy,
  bpm: patterns.avgBPM,
  basedOn: topTracks
});
```

---

## [0.1.0] - 2026-02-04 - Initial Release

### Features

- Twin Genesis Panel (upload audio, visual, bio, calendar, glow check)
- Ritual Engine (campaign planning with Full Ritual / Low-Energy modes)
- Glowline (timeline visualization with phase tracking)
- Glowmeter (energy capacity management)
- CLAROSA API integration (surface-level)
- SINK API integration (single file mood analysis)
- React + Tailwind UI with cosmic minimalism design
- Node.js + Express backend
- PostgreSQL database schema

### Design System

- Colors: Cosmic (#0F0F1A), Glow (#A882FF), Mint (#26FFE6)
- Fonts: Inter (fallback for Satoshi/General Sans)
- Single-column layout (960px max width)
- Energy-first UI philosophy

---

## Semantic Versioning

- **Major (X.0.0)**: Breaking changes, major feature releases
- **Minor (0.X.0)**: New features, backwards compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

---

**"Don't Grind. Forge."** 🌌
