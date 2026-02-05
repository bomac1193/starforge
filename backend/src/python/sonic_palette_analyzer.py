#!/usr/bin/env python3
"""
Sophisticated Sonic Palette Analysis
Extracts frequency spectrum characteristics, tonal profiles, and sonic signatures
from audio catalog for Audio DNA insights.

Audio equivalent of Visual DNA color palette extraction.
"""

import sys
import json
import argparse
from pathlib import Path
from collections import Counter
import numpy as np

try:
    import librosa
    from sklearn.cluster import KMeans
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {e}"}))
    sys.exit(1)


def extract_spectral_features(audio_path):
    """
    Extract spectral features from audio file
    Returns frequency distribution across bands
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=22050, duration=60)  # First 60 seconds

        # Extract mel-frequency cepstral coefficients (MFCCs)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

        # Extract spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]

        # Get mel spectrogram for frequency band analysis
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

        # Divide into frequency bands (bass, low-mid, mid, high-mid, treble)
        # Mel bins roughly map to frequency ranges
        n_bins = mel_spec_db.shape[0]

        # Define band boundaries (in mel bin indices)
        bass_range = (0, int(n_bins * 0.15))           # 0-250 Hz approx
        low_mid_range = (int(n_bins * 0.15), int(n_bins * 0.30))  # 250-500 Hz
        mid_range = (int(n_bins * 0.30), int(n_bins * 0.60))      # 500-2k Hz
        high_mid_range = (int(n_bins * 0.60), int(n_bins * 0.85)) # 2k-6k Hz
        treble_range = (int(n_bins * 0.85), n_bins)    # 6k+ Hz

        # Calculate average energy in each band
        bass_energy = np.mean(mel_spec_db[bass_range[0]:bass_range[1], :])
        low_mid_energy = np.mean(mel_spec_db[low_mid_range[0]:low_mid_range[1], :])
        mid_energy = np.mean(mel_spec_db[mid_range[0]:mid_range[1], :])
        high_mid_energy = np.mean(mel_spec_db[high_mid_range[0]:high_mid_range[1], :])
        treble_energy = np.mean(mel_spec_db[treble_range[0]:treble_range[1], :])

        # Tonal characteristics
        spectral_centroid_mean = np.mean(spectral_centroids)
        spectral_rolloff_mean = np.mean(spectral_rolloff)

        # Determine tonal character
        tonal_char = determine_tonal_character(
            spectral_centroid_mean,
            bass_energy,
            treble_energy,
            np.mean(spectral_bandwidth)
        )

        return {
            'frequency_bands': {
                'bass': float(bass_energy),
                'low_mid': float(low_mid_energy),
                'mid': float(mid_energy),
                'high_mid': float(high_mid_energy),
                'treble': float(treble_energy)
            },
            'spectral_centroid': float(spectral_centroid_mean),
            'spectral_rolloff': float(spectral_rolloff_mean),
            'tonal_character': tonal_char,
            'mfccs': mfccs.mean(axis=1).tolist()
        }

    except Exception as e:
        return None


def determine_tonal_character(centroid, bass, treble, bandwidth):
    """
    Determine tonal characteristics (warm/bright/dark/metallic)
    Based on spectral content
    """
    chars = []

    # Warmth: strong bass, moderate centroid
    if bass > -20 and centroid < 2000:
        chars.append('warm')

    # Brightness: high centroid, strong treble
    if centroid > 3000 or treble > -15:
        chars.append('bright')

    # Darkness: low centroid, weak treble
    if centroid < 1500 and treble < -30:
        chars.append('dark')

    # Metallic: high bandwidth, high rolloff
    if bandwidth > 2000:
        chars.append('metallic')

    # Organic: moderate values, balanced
    if 1500 < centroid < 2500 and -25 < bass < -15:
        chars.append('organic')

    return chars if chars else ['neutral']


def analyze_catalog_sonic_palette(tracks_data):
    """
    Analyze entire catalog to extract sonic palette

    Args:
        tracks_data: List of dicts with 'path', 'qualityScore', 'analysis' (optional)

    Returns:
        Sonic palette with frequency bands, tonal characteristics
    """

    all_spectral_features = []
    frequency_aggregation = {
        'bass': [],
        'low_mid': [],
        'mid': [],
        'high_mid': [],
        'treble': []
    }
    tonal_chars = []

    # Prioritize high-quality tracks for analysis
    quality_tracks = sorted(
        tracks_data,
        key=lambda t: t.get('qualityScore', 0),
        reverse=True
    )[:50]  # Analyze top 50 tracks

    analyzed_count = 0
    high_quality_count = 0

    for track in quality_tracks:
        path = track.get('path')
        if not path or not Path(path).exists():
            continue

        features = extract_spectral_features(path)
        if not features:
            continue

        analyzed_count += 1
        quality_score = track.get('qualityScore', 0)

        if quality_score > 0.7:
            high_quality_count += 1

        # Weight by quality score
        weight = quality_score if quality_score > 0 else 0.5

        # Aggregate frequency bands
        for band, energy in features['frequency_bands'].items():
            frequency_aggregation[band].append({
                'energy': energy,
                'weight': weight
            })

        # Collect tonal characteristics
        tonal_chars.extend(features['tonal_character'])

        # Store MFCC features for clustering
        all_spectral_features.append({
            'mfccs': features['mfccs'],
            'weight': weight,
            'centroid': features['spectral_centroid']
        })

    if analyzed_count == 0:
        return {
            'sonicPalette': [],
            'tonalCharacteristics': 'No tracks analyzed',
            'dominantFrequencies': [],
            'totalAnalyzed': 0,
            'highQualityCount': 0,
            'confidence': 0
        }

    # Calculate weighted prominence for each frequency band
    sonic_palette = []
    for band, values in frequency_aggregation.items():
        if not values:
            continue

        # Weighted average energy
        total_weight = sum(v['weight'] for v in values)
        weighted_energy = sum(v['energy'] * v['weight'] for v in values) / total_weight

        # Normalize to prominence (0-1 scale)
        # dB values are typically -80 to 0, normalize to 0-1
        prominence = max(0, min(1, (weighted_energy + 80) / 80))

        sonic_palette.append({
            'band': band,
            'bandLabel': get_band_label(band),
            'prominence': round(prominence, 3),
            'energyDb': round(weighted_energy, 2)
        })

    # Sort by prominence
    sonic_palette.sort(key=lambda x: x['prominence'], reverse=True)

    # Determine overall tonal characteristics
    tonal_counts = Counter(tonal_chars)
    dominant_tonal = [char for char, _ in tonal_counts.most_common(3)]
    tonal_description = generate_tonal_description(dominant_tonal, sonic_palette)

    # Dominant frequencies (top 3 bands)
    dominant_frequencies = [
        {'band': p['bandLabel'], 'prominence': p['prominence']}
        for p in sonic_palette[:3]
    ]

    # Confidence based on sample size
    confidence = min(analyzed_count / 30, 1.0)

    return {
        'sonicPalette': sonic_palette,
        'tonalCharacteristics': tonal_description,
        'dominantFrequencies': dominant_frequencies,
        'totalAnalyzed': analyzed_count,
        'highQualityCount': high_quality_count,
        'confidence': round(confidence, 2)
    }


def get_band_label(band):
    """Get human-readable label for frequency band"""
    labels = {
        'bass': 'Bass (60-250Hz)',
        'low_mid': 'Low-Mid (250-500Hz)',
        'mid': 'Mid (500-2kHz)',
        'high_mid': 'High-Mid (2-6kHz)',
        'treble': 'Treble (6kHz+)'
    }
    return labels.get(band, band)


def generate_tonal_description(dominant_chars, sonic_palette):
    """
    Generate marketing-grade tonal description
    Mirror style of Visual DNA descriptions
    """
    if not dominant_chars:
        return "Neutral sonic character with balanced frequency distribution"

    # Primary characteristic
    primary = dominant_chars[0] if dominant_chars else 'balanced'

    # Secondary characteristic
    secondary = dominant_chars[1] if len(dominant_chars) > 1 else None

    # Get dominant frequency range
    if sonic_palette:
        dominant_freq = sonic_palette[0]['band']
    else:
        dominant_freq = 'mid'

    # Build description
    freq_descriptors = {
        'bass': 'bass-driven',
        'low_mid': 'low-end focused',
        'mid': 'midrange-centered',
        'high_mid': 'upper-mid rich',
        'treble': 'high-frequency oriented'
    }

    char_descriptors = {
        'warm': 'warm',
        'bright': 'bright',
        'dark': 'dark',
        'metallic': 'metallic',
        'organic': 'organic',
        'neutral': 'balanced'
    }

    freq_desc = freq_descriptors.get(dominant_freq, 'balanced')
    char_desc = char_descriptors.get(primary, 'balanced')

    if secondary:
        secondary_desc = char_descriptors.get(secondary, '')
        description = f"{char_desc.capitalize()} {freq_desc} sonic aesthetic with {secondary_desc} undertones"
    else:
        description = f"{char_desc.capitalize()} {freq_desc} sonic aesthetic"

    return description


def main():
    parser = argparse.ArgumentParser(description='Analyze sonic palette from audio catalog')
    parser.add_argument('tracks_json', help='JSON file with track data')
    parser.add_argument('--json', action='store_true', help='Output JSON')

    args = parser.parse_args()

    # Load track data
    with open(args.tracks_json, 'r') as f:
        tracks_data = json.load(f)

    # Analyze
    result = analyze_catalog_sonic_palette(tracks_data)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Tonal Character: {result['tonalCharacteristics']}")
        print(f"Dominant Frequencies: {', '.join(f['band'] for f in result['dominantFrequencies'])}")
        print(f"Analyzed: {result['totalAnalyzed']} tracks")


if __name__ == '__main__':
    main()
