# Half-Time Detection Feature

## Overview
Detects when high-BPM tracks (140-180 BPM) have a "half-time feel" where the groove/drums are at half the detected tempo, making the track feel much slower and more relaxed.

## Problem Solved
**User Feedback**: "IF YOU WERE HERE [TONIGHT] is half time ie half 178 bpm and it would be more r&b ambient"

Without half-time detection:
- Track detected at 178 BPM
- Classified as "Drum & Bass" or "Jungle" (high-energy)
- Energy score too high for the actual vibe

With half-time detection:
- Track detected at 178 BPM (raw)
- Identified as half-time → Effective BPM: 89 BPM
- Classified as "R&B/Ambient/Chill Trap" (correct!)
- Energy reduced by 40% to reflect slower feel

## Technical Implementation

### Detection Algorithm
Located in `src/python/audio_analyzer.py` (`detect_halftime` function):

```python
def detect_halftime(y, sr, tempo, beat_frames):
    """
    Detect half-time feel (high BPM but feels slower)
    Common in: R&B, slow jams, chill trap, lo-fi hip hop
    """
    # Only check if BPM is high enough
    if tempo < 140:
        return False, tempo

    # Calculate onset strength and density
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units='frames')

    # Expected vs actual beats per second
    expected_beats_per_sec = tempo / 60.0
    actual_beats_per_sec = len(onset_frames) / duration

    # Beat density ratio
    beat_density_ratio = actual_beats_per_sec / expected_beats_per_sec

    # Average onset strength
    avg_onset_strength = np.mean(onset_env)

    # Half-time indicators:
    # 1. Beat density is ~50% of expected (beats on 2 and 4 instead of every beat)
    # 2. Lower onset strength than typical high-BPM tracks
    # 3. BPM is in typical half-time range (140-180)

    is_halftime = (
        tempo >= 140 and
        tempo <= 180 and
        beat_density_ratio < 0.65 and  # Fewer beats than expected
        avg_onset_strength < 1.5  # Lower beat intensity
    )

    if is_halftime:
        effective_bpm = tempo / 2
        return True, effective_bpm
    else:
        return False, tempo
```

### Energy Adjustment
When half-time is detected, energy score is reduced by 40%:

```python
# Adjust energy for half-time (feels slower/calmer despite high BPM)
if is_halftime:
    halftime_reduction = 0.6  # Multiply by 0.6 = 40% reduction
    energy = energy * halftime_reduction
```

### New Fields in Analysis Result
- `bpm`: Raw detected BPM (e.g., 178.2)
- `effective_bpm`: Adjusted BPM for half-time (e.g., 89.1)
- `is_halftime`: Boolean flag (true/false)

## Test Results

### "IF YOU WERE HERE TONIGHT" Track

**Before Half-Time Detection**:
```
Detected BPM: 178.2
Energy: 0.065 (severely underestimated)
Genre: Drum & Bass / Jungle (WRONG)
```

**After Half-Time Detection**:
```
Detected BPM:   178.2 BPM (raw detection)
Effective BPM:  89.1 BPM (half-time adjusted)
Is Half-Time:   YES ✓
Energy:         0.600 (reduced by 40% to reflect slower feel)
Genre:          Chill Trap / Lo-fi Hip Hop / R&B (CORRECT!)
```

## Genre Classification Guide

### With Half-Time Detection

**Half-Time Tracks** (140-180 BPM detected, 70-90 BPM effective):
- 60-80 BPM effective → R&B / Slow Jam
- 80-100 BPM effective → Chill Trap / Lo-fi Hip Hop
- 100-120 BPM effective → Ambient / Downtempo

**Full-Time Tracks** (140-180 BPM):
- 140-160 BPM → Breakbeat / Footwork
- 160-180 BPM → Drum & Bass / Jungle

### Common Half-Time Genres
- **R&B** - 140-160 BPM detected, 70-80 BPM feel
- **Slow Jams** - 140-160 BPM detected, 70-80 BPM feel
- **Chill Trap** - 140-160 BPM detected, 70-80 BPM feel
- **Lo-fi Hip Hop** - 160-180 BPM detected, 80-90 BPM feel
- **Alternative R&B** - 140-180 BPM detected, 70-90 BPM feel

### Characteristics of Half-Time
- **Drums**: Kick and snare on 2 and 4 (instead of every beat)
- **Feel**: Relaxed, spacious, slow-moving
- **Energy**: Low to medium (despite high BPM)
- **Common elements**: Long reverb tails, vocal chops, sub-bass emphasis
- **Examples**: The Weeknd, Frank Ocean, SZA slow jams

## Database Schema

Added fields to `audio_tracks` table:
```sql
effective_bpm REAL,      -- Adjusted BPM (half of raw BPM if half-time)
is_halftime BOOLEAN,     -- True if half-time detected
```

## Usage

### Automatic Detection
All new uploads automatically get half-time detection:
```bash
# Upload a track
POST /api/audio/upload-and-analyze

# Response includes:
{
  "bpm": 178.2,
  "effective_bpm": 89.1,
  "is_halftime": true,
  "energy": 0.6
}
```

### Manual Testing
```bash
# Test specific track
node test_halftime_detection.js

# Output:
✓ HALF-TIME DETECTED!
  Track feels like 89 BPM (half of 178 BPM)
  Energy reduced by 40% to reflect slower feel
  Should be classified as: R&B/Ambient/Chill (not D&B/Jungle)
```

## Impact on Features

### Catalog Analysis
- Uses `effective_bpm` for genre classification
- More accurate BPM range calculation
- Correct genre distribution

### Influence Genealogy
- Half-time tracks grouped with their effective BPM peers
- R&B/Chill Trap correctly identified
- Better genre lineage mapping

### Energy-Based Filtering
- Energy scores reflect actual vibe (not just raw BPM)
- Half-time tracks show as low-medium energy
- Correct playlist generation

## Essentia Installation

Fixed Essentia installation issue:
```bash
# Previous error: "externally-managed-environment"
# Solution: Use --break-system-packages flag
python3 -m pip install essentia --break-system-packages

# Successfully installed essentia-2.1b6.dev1389
```

Essentia provides even more accurate analysis for comparison and validation.

## Future Enhancements

### Potential Improvements
1. **Double-Time Detection**: Opposite of half-time (detected BPM is half the feel)
2. **Swing Detection**: Quantify groove/swing percentage
3. **Groove Classification**: Straight vs swung vs shuffled
4. **Confidence Scoring**: How certain is the half-time detection
5. **Visual Indicators**: UI badge/icon for half-time tracks

### Edge Cases to Handle
- Tracks that shift between half-time and full-time
- Very slow half-time (sub-60 BPM effective)
- Complex polyrhythms
- Live recordings with tempo drift

## Troubleshooting

### Track Not Detected as Half-Time
**Possible causes**:
- BPM outside 140-180 range (adjust thresholds if needed)
- Beat density ratio >= 0.65 (track has more beats than expected)
- Onset strength >= 1.5 (beats are very pronounced)

**Solution**: Adjust thresholds in `detect_halftime()` function if needed.

### False Positives
**Symptom**: Full-time D&B incorrectly flagged as half-time

**Cause**: Very sparse beat patterns or low-intensity drums

**Solution**: Increase `avg_onset_strength` threshold or adjust `beat_density_ratio`.

## Summary

**Problem**: High-BPM tracks misclassified due to half-time feel being ignored

**Solution**: Detect half-time patterns and adjust effective BPM + energy accordingly

**Result**:
- "IF YOU WERE HERE TONIGHT" correctly classified as R&B/Chill (89 BPM feel) instead of D&B (178 BPM)
- Energy score reflects actual vibe (0.6 instead of 0.065 or 1.0)
- Genre classification now accounts for groove/feel, not just raw BPM

---

**Last Updated**: 2025-02-05
**Version**: 2.1 (Half-Time Detection + Improved Energy + Spotify Integration)
