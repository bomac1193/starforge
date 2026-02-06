#!/usr/bin/env python3
"""
Enhanced audio analyzer with quality scoring and highlight detection
"""

import sys
import json
import argparse
import numpy as np
import librosa
from scipy.signal import find_peaks
import pyloudnorm as pyln

def validate_bpm_with_multiples(tempo, y, sr, filename=''):
    """
    Check if detected BPM makes sense or if a multiple/division is more accurate
    Common issues:
    - Drum & Bass detected as half (86 instead of 174)
    - Dubstep detected as 1.2x or 1.5x (147 instead of 124)
    - Slow tracks detected as double (180 instead of 90)
    """
    # Try to extract BPM from filename (many producers include it)
    import re
    filename_bpm = None
    bpm_pattern = r'\b(\d{2,3})\s*(?:bpm|BPM)?\b'
    matches = re.findall(bpm_pattern, filename)
    if matches:
        for match in matches:
            potential_bpm = int(match)
            if 60 <= potential_bpm <= 200:  # Reasonable BPM range
                filename_bpm = potential_bpm
                break

    # If filename has BPM, trust it (unless very different from detection)
    if filename_bpm:
        if abs(tempo - filename_bpm) / filename_bpm < 0.15:  # Within 15%
            return filename_bpm
        # Check if tempo is a multiple/division of filename BPM
        for mult in [2.0, 0.5, 1.5, 0.67]:  # 2x, 0.5x, 1.5x, 2/3x
            if abs(tempo - (filename_bpm * mult)) / (filename_bpm * mult) < 0.15:
                return filename_bpm

    # Check common problem ranges
    candidates = [tempo]

    # If detected BPM is suspiciously low (<100), check 2x
    if tempo < 100:
        candidates.append(tempo * 2)

    # If detected BPM is in D&B range but might be halved (80-95)
    if 80 <= tempo <= 95:
        candidates.append(tempo * 2)  # Check drum & bass tempo (160-190)

    # If detected BPM is in awkward range (145-155), check 0.8x or 1.2x
    # (might be dubstep detected wrong)
    if 145 <= tempo <= 155:
        candidates.append(tempo / 1.2)  # ~124 dubstep
        candidates.append(tempo * 0.8)

    # If detected BPM is very high (>170), check 0.5x
    if tempo > 170:
        candidates.append(tempo / 2)

    # Calculate onset strength for each candidate to see which fits best
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    best_tempo = tempo
    best_score = 0

    for candidate in candidates:
        # Calculate how well this BPM matches the onset patterns
        # Use tempogram to see energy at this BPM
        if candidate > 0:
            try:
                tempogram = librosa.feature.tempogram(onset_envelope=onset_env, sr=sr)
                tempo_freqs = librosa.core.tempo_frequencies(len(tempogram), sr=sr)

                # Find closest frequency to candidate BPM
                idx = np.argmin(np.abs(tempo_freqs - candidate))
                score = np.mean(tempogram[idx])

                if score > best_score:
                    best_score = score
                    best_tempo = candidate
            except:
                pass

    return best_tempo

def detect_halftime(y, sr, tempo, beat_frames):
    """
    Detect half-time feel (high BPM but feels slower)
    Common in: R&B, slow jams, chill trap, lo-fi hip hop

    Example: 178 BPM half-time = feels like 89 BPM
    """
    # Only check if BPM is high enough to possibly be half-time
    if tempo < 140:
        return False, tempo

    # Calculate onset strength (how pronounced the beats are)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)

    # Count actual onsets (detected beats)
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units='frames')

    # Expected beats per second at detected tempo
    expected_beats_per_sec = tempo / 60.0

    # Actual beats per second
    duration = librosa.get_duration(y=y, sr=sr)
    actual_beats_per_sec = len(onset_frames) / duration if duration > 0 else 0

    # If actual beat density is much lower than expected, likely half-time
    beat_density_ratio = actual_beats_per_sec / expected_beats_per_sec if expected_beats_per_sec > 0 else 1.0

    # Calculate average onset strength (how strong the beats are)
    avg_onset_strength = np.mean(onset_env)

    # Half-time indicators:
    # 1. Beat density is ~50% of expected (beats on 2 and 4 instead of every beat)
    # 2. Lower onset strength than typical high-BPM tracks
    # 3. BPM is in typical half-time range (140-180)

    is_halftime = (
        tempo >= 140 and
        tempo <= 180 and
        beat_density_ratio < 0.65 and  # Significantly fewer beats than expected
        avg_onset_strength < 1.5  # Lower beat intensity than typical D&B/jungle
    )

    if is_halftime:
        effective_bpm = tempo / 2
        return True, effective_bpm
    else:
        return False, tempo

def analyze_audio(audio_path, include_quality=False, detect_highlights=False, num_highlights=3):
    """
    Analyze audio file with comprehensive feature extraction
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # LUFS LOUDNESS NORMALIZATION (for fair energy comparison)
        # Normalize to -14 LUFS (streaming standard) before energy calculation
        # This removes mastering loudness bias - quiet tracks normalized UP, loud tracks normalized DOWN
        meter = pyln.Meter(sr)  # Create loudness meter
        loudness = meter.integrated_loudness(y)  # Measure current loudness

        # Normalize to -14 LUFS target (Spotify/Apple Music standard)
        y_normalized = pyln.normalize.loudness(y, loudness, -14.0)

        # Use normalized audio for energy calculation (but original for BPM/key/spectral)
        y_for_energy = y_normalized

        # Basic features
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

        # IMPROVED: Validate BPM and check multiples (fixes D&B detected as half, etc.)
        tempo = validate_bpm_with_multiples(tempo, y, sr, audio_path)

        tempo_confidence = calculate_tempo_confidence(y, sr, tempo)

        # Half-time detection (critical for R&B, slow jams, chill trap)
        is_halftime, effective_bpm = detect_halftime(y, sr, tempo, beat_frames)

        # Chromagram for key detection
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key = estimate_key(chroma)

        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]

        # IMPROVED ENERGY CALCULATION (using LUFS-normalized audio)
        # 1. RMS energy per frame (from normalized audio for fair comparison)
        rms = librosa.feature.rms(y=y_for_energy, frame_length=2048, hop_length=512)[0]

        # 2. Exclude quiet sections (below threshold)
        rms_db = librosa.amplitude_to_db(rms, ref=np.max)
        threshold_db = np.percentile(rms_db, 25)  # Ignore quietest 25%
        mask = rms_db > threshold_db

        if np.any(mask):
            active_rms = rms[mask]
        else:
            active_rms = rms

        # 3. Calculate energy from active sections only
        improved_energy = np.mean(active_rms)

        # 4. Calculate spectral flux (perceived energy from normalized audio)
        spectral_flux = librosa.onset.onset_strength(y=y_for_energy, sr=sr)
        spectral_energy = np.mean(spectral_flux) / 10.0

        # 5. Combine RMS and spectral flux (weighted)
        # Favor spectral characteristics (brightness/dynamics) over pure loudness for club music
        combined_energy = (improved_energy * 0.4) + (spectral_energy * 0.6)

        # 6. Apply loudness normalization (calibrated for better spread)
        # Typical RMS values: quiet=0.01, moderate=0.05, loud=0.15, very loud=0.3+
        # Map to 0-1 range with better distribution
        if combined_energy > 0:
            # Use power scaling for better spread (not logarithmic)
            # This gives: 0.01→0.2, 0.05→0.45, 0.1→0.63, 0.15→0.77, 0.2→0.89, 0.3+→1.0
            energy = min(1.0, (combined_energy / 0.2) ** 0.7)
        else:
            energy = 0

        # 7. Adjust energy for half-time (feels slower/calmer despite high BPM)
        if is_halftime:
            # Half-time tracks feel more chill/ambient despite high detected BPM
            # Reduce energy score by 30-50% depending on how pronounced the half-time feel is
            halftime_reduction = 0.6  # Multiply by 0.6 = 40% reduction
            energy = energy * halftime_reduction

        # Loudness from active sections
        loudness_db = librosa.amplitude_to_db(np.mean(active_rms))

        # Valence estimation (rough approximation from spectral features)
        valence = estimate_valence(spectral_centroids, spectral_rolloff)

        # Silence ratio
        silence_ratio = calculate_silence_ratio(y, sr)

        result = {
            'duration': float(duration),
            'bpm': float(np.asarray(tempo).item()) if hasattr(tempo, '__iter__') else float(tempo),
            'effective_bpm': float(np.asarray(effective_bpm).item()) if hasattr(effective_bpm, '__iter__') else float(effective_bpm),
            'is_halftime': bool(is_halftime),
            'key': key,
            'energy': float(energy),
            'valence': float(valence),
            'loudness': float(loudness_db),
            'spectral_centroid': float(np.mean(spectral_centroids)),
            'spectral_rolloff': float(np.mean(spectral_rolloff)),
            'zero_crossing_rate': float(np.mean(zero_crossing_rate)),
            'silence_ratio': float(silence_ratio),
            'tempo_confidence': float(tempo_confidence)
        }

        # Quality scoring
        if include_quality:
            quality = calculate_quality_score(result)
            result['quality_score'] = quality['overall']
            result['quality_breakdown'] = quality['breakdown']

        # Highlight detection
        if detect_highlights:
            highlights = detect_track_highlights(y, sr, num_highlights)
            result['highlights'] = highlights

        return result

    except Exception as e:
        return {'error': str(e)}


def calculate_tempo_confidence(y, sr, estimated_tempo):
    """
    Calculate confidence in tempo detection
    """
    # Use onset strength as a proxy for rhythm clarity
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_strength = np.mean(onset_env)

    # Normalize to 0-1
    confidence = min(1.0, onset_strength / 2.0)
    return confidence


def estimate_key(chroma):
    """
    Estimate musical key from chromagram
    """
    # Average chroma across time
    chroma_avg = np.mean(chroma, axis=1)

    # Find dominant pitch class
    dominant_pitch = np.argmax(chroma_avg)

    # Map to key names
    keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    # Simple major/minor detection (heuristic)
    # If 3rd and 5th are strong -> major, if minor 3rd -> minor
    third = (dominant_pitch + 4) % 12
    minor_third = (dominant_pitch + 3) % 12

    if chroma_avg[third] > chroma_avg[minor_third]:
        mode = 'major'
    else:
        mode = 'minor'

    return f"{keys[dominant_pitch]} {mode}"


def estimate_valence(spectral_centroids, spectral_rolloff):
    """
    Estimate valence (positivity) from spectral features
    Brighter sound (higher spectral centroid) -> higher valence
    """
    # Normalize spectral centroid to 0-1
    centroid_mean = np.mean(spectral_centroids)

    # Typical range: 1000-4000 Hz
    valence = (centroid_mean - 1000) / 3000
    valence = max(0.0, min(1.0, valence))

    return valence


def calculate_silence_ratio(y, sr, threshold_db=-40):
    """
    Calculate ratio of silence in the track
    """
    # Convert to dB
    db = librosa.amplitude_to_db(np.abs(y), ref=np.max)

    # Count frames below threshold
    silent_frames = np.sum(db < threshold_db)
    total_frames = len(db)

    return silent_frames / total_frames if total_frames > 0 else 0


def calculate_quality_score(analysis):
    """
    Calculate quality score from analysis features
    """
    scores = {}

    # 1. Duration score
    duration = analysis['duration']
    if duration < 10:
        scores['duration'] = 0.3
    elif duration < 30:
        scores['duration'] = 0.6
    elif duration < 60:
        scores['duration'] = 0.8
    else:
        scores['duration'] = 1.0

    # 2. Loudness score
    loudness = analysis['loudness']
    if loudness < -30:
        scores['loudness'] = 0.4
    elif loudness < -20:
        scores['loudness'] = 0.7
    else:
        scores['loudness'] = 1.0

    # 3. Silence ratio score
    silence_ratio = analysis['silence_ratio']
    scores['silence'] = max(0, 1.0 - silence_ratio)

    # 4. Tempo confidence score
    tempo_conf = analysis['tempo_confidence']
    scores['tempo'] = tempo_conf

    # Weighted average
    overall = (
        scores['duration'] * 0.25 +
        scores['loudness'] * 0.25 +
        scores['silence'] * 0.25 +
        scores['tempo'] * 0.25
    )

    return {
        'overall': round(overall, 2),
        'breakdown': {k: round(v, 2) for k, v in scores.items()}
    }


def detect_track_highlights(y, sr, num_highlights=3):
    """
    Detect the best moments/highlights in a track
    """
    highlights = []

    # 1. Energy-based highlights
    rms = librosa.feature.rms(y=y)[0]
    energy_peaks_idx = find_peaks(rms, height=np.percentile(rms, 75))[0]

    # Convert to time
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)

    for idx in energy_peaks_idx[:num_highlights]:
        start_time = times[idx]
        highlights.append({
            'start': float(start_time),
            'end': float(start_time + 10),  # 10-second highlight
            'score': float(rms[idx]),
            'reason': 'energy_peak',
            'peak_feature': 'energy'
        })

    # 2. Novelty-based highlights (unique moments)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    novelty_peaks_idx = find_peaks(onset_env, height=np.percentile(onset_env, 75))[0]

    for idx in novelty_peaks_idx[:num_highlights]:
        frame_idx = min(idx, len(times) - 1)
        start_time = times[frame_idx]
        highlights.append({
            'start': float(start_time),
            'end': float(start_time + 10),
            'score': float(onset_env[idx]),
            'reason': 'novelty_peak',
            'peak_feature': 'onset_strength'
        })

    # 3. Spectral contrast highlights (interesting frequency content)
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    contrast_mean = np.mean(spectral_contrast, axis=0)
    contrast_peaks_idx = find_peaks(contrast_mean, height=np.percentile(contrast_mean, 75))[0]

    for idx in contrast_peaks_idx[:num_highlights]:
        frame_idx = min(idx, len(times) - 1)
        start_time = times[frame_idx]
        highlights.append({
            'start': float(start_time),
            'end': float(start_time + 10),
            'score': float(contrast_mean[idx]),
            'reason': 'spectral_interest',
            'peak_feature': 'spectral_contrast'
        })

    # Sort by score and take top N
    highlights.sort(key=lambda x: x['score'], reverse=True)
    return highlights[:num_highlights]


def main():
    parser = argparse.ArgumentParser(description='Analyze audio file')
    parser.add_argument('audio_path', help='Path to audio file')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    parser.add_argument('--quality', action='store_true', help='Include quality scoring')
    parser.add_argument('--highlights', action='store_true', help='Detect highlights')
    parser.add_argument('--num-highlights', type=int, default=3, help='Number of highlights to detect')

    args = parser.parse_args()

    result = analyze_audio(
        args.audio_path,
        include_quality=args.quality,
        detect_highlights=args.highlights,
        num_highlights=args.num_highlights
    )

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        for key, value in result.items():
            print(f"{key}: {value}")


if __name__ == '__main__':
    main()
