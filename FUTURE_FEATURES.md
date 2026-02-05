# Starforge - Future Feature Roadmap

This document tracks potential features and enhancement avenues for future development.

---

## High Priority Features

### 1. DJ Profile & Reference Matching

**Status:** Designed, Not Implemented
**Complexity:** Medium (200-300 lines)
**Value:** High - Marketing/positioning tool

**What It Does:**
Analyzes your genre distribution, BPM range, and diversity score to generate:
- DJ archetype classification (e.g., "Afro-Global Bass Selector")
- Reference DJ/artist comparisons in your lane
- Strengths and positioning insights
- Gig suitability recommendations

**Technical Approach:**
```javascript
// Use existing data
- Genre distribution (from Influence Genealogy)
- BPM range + average (from Aggregate Stats)
- Diversity score (from Library Diversity)

// Match to archetypes
const archetypes = [
  { name: "Afro-Global Selector", genres: ["Amapiano", "Afrobeats"], bpmRange: [100-130] },
  { name: "UK Bass Specialist", genres: ["Grime", "UK Garage", "Dubstep"], bpmRange: [130-145] },
  { name: "Genre-Fluid Chameleon", diversity: "high", bpmRange: [90-160] },
  // ... more archetypes
];

// Generate profile
{
  archetype: "Afro-Global Bass Selector",
  referenceDJs: ["Black Coffee", "Conducta", "DJ Lag"],
  strengths: [
    "Genre bridge-building (SA + UK)",
    "Mid-tempo mastery (124 BPM avg)",
    "Cultural fluency across diaspora"
  ],
  bestSuitedFor: [
    "Festival side stages",
    "Afrobeats-UK crossover nights",
    "Late afternoon > early peak sets"
  ],
  lessSuitedFor: [
    "Pure techno rooms",
    "High-BPM D&B sets",
    "100% Hip Hop nights"
  ]
}
```

**Implementation Steps:**
1. Create DJ archetype database (8-10 archetypes)
2. Build reference DJ profiles with genre/BPM data
3. Matching algorithm based on overlap scoring
4. Strengths generator analyzing unique combinations
5. Frontend component displaying profile + references

**Display Location:**
- New section in Influence Genealogy panel
- Or standalone "DJ Profile" page

---

## Audio DNA Enhancements

### 2. Cultural Moment Detection

**Status:** Placeholder
**Complexity:** High
**Value:** High - Early trend spotting

**What It Does:**
Analyzes emerging sounds and cultural movements in your library before they hit mainstream.

**Technical Requirements:**
- Trend detection algorithm analyzing new additions
- Database of cultural movements with sonic signatures
- Real-time monitoring across user base
- Early signal detection (6-12 months pre-mainstream)

**Example Output:**
```
Emerging in Your Library:

1. SA Bacardi (Durban sound)
   - 3 tracks added in last month
   - 127 BPM, vocal chops, log drums
   - Currently underground, predicted breakout: Q3 2026

2. UK Drill 2.0 (melodic shift)
   - 5 tracks, avg rating 4.2 stars
   - 140 BPM, darker than standard drill
   - Early adopter position: Top 5%
```

**Implementation Approach:**
- Track addition timestamps + clustering
- Genre evolution tracking
- Cross-user pattern detection
- Spotify/Shazam API integration for validation

---

### 3. Rarity Score

**Status:** Placeholder
**Complexity:** High
**Value:** Medium - Curation insight

**What It Does:**
Calculates how rare/unique each track is compared to:
- Genre norms (statistical outliers)
- Other DJs' libraries (if data available)
- Mainstream charts/playlists

**Technical Requirements:**
- Build frequency distribution database
- Statistical uniqueness calculation (z-scores)
- Comparative analysis vs genre baselines
- Breakdown by feature (rare tempo, rare key, rare sound)

**Example Output:**
```
Track: "Horizons" by Artist X
Rarity Score: 87/100 (Very Rare)

Breakdown:
- BPM: 137 (rare for Hip Hop, common for Grime)
- Key: E♭m (uncommon, 8% of tracks)
- Energy: 0.82 (high for 137 BPM)
- Genre: Grime x Amapiano fusion (0.03% of databases)

Positioning: "Deep cut, niche crossover"
```

---

### 4. Scene Mapping

**Status:** Placeholder
**Complexity:** Very High
**Value:** Medium - Educational/contextual

**What It Does:**
Maps your music to specific subcultures, geographic scenes, and social contexts.

**Technical Requirements:**
- Subculture taxonomy database
- Scene-specific sonic signature patterns
- Geographic + temporal context
- Social graph of scene relationships

**Example Output:**
```
Your Scene Map:

Primary Scenes:
1. Johannesburg Townships (32% of library)
   - Amapiano, Gqom, Afro House
   - Peak era: 2018-present
   - Key venues: Zone 6, Taboo
   - Social context: Post-apartheid youth culture

2. London Pirate Radio (18% of library)
   - Grime, UK Garage, Dubstep
   - Peak era: 2002-2010
   - Key platforms: Rinse FM, Deja Vu
   - Social context: UK Black British, MC culture

Scene Bridges:
- Your library connects SA townships > UK council estates
- Rare overlap: Only 2% of DJs bridge both scenes
```

---

### 5. Sonic Palette Extraction (Audio DNA)

**Status:** Planned (in Audio DNA plan)
**Complexity:** Medium-High
**Value:** High - Visual DNA equivalent for audio

**What It Does:**
Audio equivalent of Visual DNA color palette - extracts dominant frequency/tonal characteristics.

**Technical Requirements:**
- Frequency spectrum analysis using librosa
- Cluster audio into "sonic colors" (Bass, Mid, Treble ranges)
- Weight by prominence across catalog
- Generate marketing-grade sonic description

**Example Output:**
```
Your Sonic Palette:

Dominant Frequencies:
██████████ Bass (60-250Hz) - 35% prominence
██████ Low-Mid (250-500Hz) - 18%
████████ Mid (500-2kHz) - 28%
███ High-Mid (2-6kHz) - 12%
██ Treble (6kHz+) - 7%

Tonal Characteristics:
- Warm, bass-forward signature
- Sub-heavy foundation (kick drums, 808s)
- Moderate vocal presence (mid range)
- Restrained high-end (not bright/airy)

Description: "Sub-pressure specialist with warm, organic midrange"
```

---

### 6. Cross-Modal Coherence Analysis

**Status:** Planned (in Audio DNA plan)
**Complexity:** Medium
**Value:** Medium - Twin OS integration

**What It Does:**
Analyzes alignment between Visual DNA (CLAROSA photos) and Audio DNA.

**Technical Requirements:**
- Compare visual palette warmth vs audio warmth
- Visual energy (photo themes) vs audio energy
- Palette diversity vs genre diversity
- Coherence scoring (0-1 scale)

**Example Output:**
```
Visual-Audio Alignment: 73%

Matches:
✓ Warm color palette = warm bass tones (85% match)
✓ High visual energy = high audio energy (68% match)
✓ Color diversity = genre diversity (71% match)

Mismatches:
✗ Intimate photo themes vs club-focused music (42% match)

Interpretation:
Your visual and audio tastes are mostly aligned. The intimacy
mismatch suggests you prefer personal photography but social music.
```

---

## Library Management Features

### 7. Effective Track Count & Usage Analysis

**Status:** Considered, Held for UX Design
**Complexity:** Low-Medium
**Value:** Medium - Curation tool

**What It Does:**
Shows how much of your library you actually use vs "dead weight".

**Better Framing (Positive UX):**
```
Library Usage Breakdown:

Core Rotation: 350 tracks (10+ plays)
- Your working library
- 8.6% of total collection

Hidden Gems: 180 tracks (5★ rated, <5 plays)
- High quality, underutilized
- Rediscovery recommendations available

Exploration Pool: 3,533 tracks
- Discovery library
- Potential finds waiting

Archive Candidates: 420 tracks (0 plays, 0 stars, >6 months old)
- Consider archiving to streamline
```

**Implementation Notes:**
- Needs careful UX to avoid feeling negative
- Frame as "working library" vs "discovery library"
- Provide actionable recommendations (rediscover playlists)
- Could be part of "Library Health" feature

---

### 8. Smart Crate Building

**Status:** Idea
**Complexity:** Medium
**Value:** High for DJs

**What It Does:**
Auto-generates set crates based on criteria:
- Gig type (festival, club, radio)
- Desired energy arc
- Genre mix
- BPM progression

**Example:**
```
Input: "2-hour festival set, sunset slot, 50% Amapiano, energy: mellow > peak"

Output: Smart Crate (45 tracks)
- Phase 1 (30min): Amapiano 108-115 BPM, mellow energy
- Phase 2 (45min): Afro House 118-125 BPM, building
- Phase 3 (30min): UK Garage 130-138 BPM, peak
- Phase 4 (15min): Cool-down, back to 120 BPM

BPM arc: 108 → 138 → 120
Genre arc: SA → Global → UK → Fusion
Energy arc: 0.4 → 0.8 → 0.6
```

---

## Data Enrichment

### 9. AI Genre Auto-Tagging

**Status:** Idea
**Complexity:** High
**Value:** Medium - Improves accuracy

**What It Does:**
Uses AI to automatically tag tracks without genre metadata (83.6% of your library).

**Technical Approaches:**
- Audio feature analysis (spectral, timbral)
- ML model trained on labeled dataset
- Confidence scoring
- User validation/correction loop

**Impact:**
- Currently only 16.4% of tracks have genre tags
- Would improve genre matching accuracy
- Better catalog analysis for untagged music

---

### 10. Collaborative Filtering (If Multi-User)

**Status:** Future consideration
**Complexity:** Very High
**Value:** High if user base exists

**What It Does:**
"DJs who play Amapiano + Grime also play..."

**Requirements:**
- Multi-user data
- Privacy-preserving
- Similarity scoring between users
- Recommendation engine

---

## Integration Possibilities

### 11. Serato Integration

**Status:** Research needed
**Complexity:** Medium
**Value:** High - Expands user base

**What It Does:**
Import Serato crate data, play counts, BPM analysis.

**Technical Requirements:**
- Parse Serato database format
- Map to Starforge data model
- Handle Serato-specific features

---

### 12. Traktor Integration

**Status:** Research needed
**Complexity:** Medium
**Value:** Medium

Same as Serato but for Native Instruments Traktor users.

---

### 13. Spotify/Apple Music Listening Integration

**Status:** Idea
**Complexity:** High
**Value:** Medium - Broader music taste

**What It Does:**
Combine DJ library analysis with personal streaming listening.

**Use Case:**
- DJ library = what you play for others
- Streaming = what you listen to personally
- Compare/contrast for interesting insights

---

## Marketing & Export

### 14. Press Kit Generator

**Status:** Idea
**Complexity:** Low
**Value:** Medium - Professional tool

**What It Does:**
Auto-generates DJ bio/press materials from analysis:
- Genre specialization
- BPM range
- Influences
- Scene positioning
- Quote-ready descriptions

**Example Output:**
```
DJ Bio (Auto-Generated):

[Your Name] is an Afro-Global Bass selector bridging South African
township sounds with UK pirate radio legacy. Specializing in the
mid-tempo zone (93-155 BPM), they seamlessly weave Amapiano, Grime,
and Jersey Club into genre-fluid sets. With sonic influences ranging
from Black Coffee to Conducta, [Your Name] occupies the rare space
where cultural movements intersect.

Key Stats:
- Genres: 15+ subgenres (Selective Curator profile)
- BPM: 93-155 (mid-tempo specialist)
- Style: Afrobeats-UK crossover
- Influences: SA townships, UK pirate radio, US club

Best For: Festival side stages, crossover nights, radio shows
```

---

### 15. Set History Analysis

**Status:** Idea
**Complexity:** Medium
**Value:** High - Performance insights

**What It Does:**
If play history includes set/gig markers, analyze performance patterns:
- What works in different contexts
- Energy arc patterns
- Genre progression strategies
- Crowd response proxies (if tracked)

---

## Technical Infrastructure

### 16. Real-Time Audio Analysis

**Status:** Future enhancement
**Complexity:** Very High
**Value:** High - Better accuracy

**What It Does:**
Analyze actual audio files for energy, valence, key, etc.

**Currently:**
- Only 16.4% have genre metadata
- No energy/valence data from Rekordbox
- BPM-only matching for most tracks

**With This:**
- Full audio features for all tracks
- Better genre matching
- More accurate analysis

**Technical Requirements:**
- Audio processing pipeline (librosa, essentia)
- GPU acceleration for batch processing
- Storage for analysis results

---

## Priority Recommendations

**Implement Next (High Value, Medium Effort):**
1. DJ Profile & References - Marketing value, uses existing data
2. Smart Crate Building - Practical DJ tool
3. Press Kit Generator - Low effort, professional appeal

**Implement Later (High Value, High Effort):**
1. Real-Time Audio Analysis - Accuracy boost
2. Cultural Moment Detection - Unique positioning
3. AI Genre Auto-Tagging - Fill metadata gaps

**Consider (Medium Value):**
1. Sonic Palette Extraction - Cool factor
2. Rarity Score - Curation insight
3. Scene Mapping - Educational value

**Hold (Requires User Base/Research):**
1. Collaborative Filtering
2. Serato/Traktor Integration
3. Multi-user features

---

## Notes

- Features marked "Placeholder" have UI space reserved but no implementation
- Features marked "Planned" have architectural design but need development
- Features marked "Idea" are conceptual and need full design

**Last Updated:** 2026-02-05
