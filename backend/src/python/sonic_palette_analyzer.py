#!/usr/bin/env python3
"""
Sophisticated Sonic Palette Analysis
Extracts frequency palettes, tonal profiles, and sonic signatures
from user's music collection for marketing-grade insights.

Audio equivalent of Visual DNA color palette.
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


# Frequency band definitions (Hz)
FREQUENCY_BANDS = {
    'bass': (60, 250),
    'low_mid': (250, 500),
    'mid': (500, 2000),
    'high_mid': (2000, 6000),
    'treble': (6000, 20000)
}


def extract_spectral_features(audio_path, sr=22050, duration=30):
    """
    Extract spectral features from audio file
    Returns frequency band energies and tonal characteristics
    """
    try:
        # Load audio (first 30 seconds for speed)
        y, sr = librosa.load(audio_path, duration=duration, sr=sr)
        
        # Extract spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        
        # Get frequency spectrum
        stft = np.abs(librosa.stft(y))
        freqs = librosa.fft_frequencies(sr=sr)
        
        # Calculate energy in each frequency band
        band_energies = {}
        for band_name, (low, high) in FREQUENCY_BANDS.items():
            # Find frequency bins in this range
            mask = (freqs >= low) & (freqs < high)
            band_energy = np.mean(stft[mask, :]) if np.any(mask) else 0
            band_energies[band_name] = float(band_energy)
        
        # Tonal characteristics
        brightness = np.mean(spectral_centroids)  # Higher = brighter
        warmth = band_energies['bass'] / (band_energies['treble'] + 1e-6)  # Bass vs treble ratio
        richness = np.std(mfccs)  # Timbral complexity
        
        return {
            'band_energies': band_energies,
            'brightness': float(brightness),
            'warmth': float(warmth),
            'richness': float(richness),
            'spectral_centroid': float(np.mean(spectral_centroids)),
            'spectral_rolloff': float(np.mean(spectral_rolloff))
        }
        
    except Exception as e:
        print(f"Error analyzing {audio_path}: {e}", file=sys.stderr)
        return None


def analyze_track_collection(tracks_data):
    """
    Analyze entire track collection to extract sonic DNA
    
    Args:
        tracks_data: List of dicts with 'path', 'bpm', 'energy', etc.
    
    Returns:
        Sonic DNA profile with frequency palette, style, characteristics
    """
    
    # Extract spectral features from all tracks
    all_features = []
    
    # Prioritize tracks with higher energy/quality
    sorted_tracks = sorted(tracks_data, key=lambda t: t.get('energy', 0.5), reverse=True)
    
    # Analyze up to 50 tracks for comprehensive profile
    analyzed_count = 0
    for track in sorted_tracks[:50]:
        path = track.get('path')
        if not path or not Path(path).exists():
            continue
        
        features = extract_spectral_features(path)
        if features:
            all_features.append({
                **features,
                'bpm': track.get('bpm', 120),
                'energy': track.get('energy', 0.5)
            })
            analyzed_count += 1
        
        # Limit analysis to avoid long processing times
        if analyzed_count >= 30:
            break
    
    if len(all_features) == 0:
        return {
            'styleDescription': 'No tracks could be analyzed',
            'confidence': 0,
            'trackCount': 0
        }
    
    # Aggregate frequency band energies
    band_aggregates = {band: [] for band in FREQUENCY_BANDS.keys()}
    for feat in all_features:
        for band, energy in feat['band_energies'].items():
            band_aggregates[band].append(energy)
    
    # Calculate average prominence for each band
    sonic_palette = []
    for band, energies in band_aggregates.items():
        avg_energy = np.mean(energies)
        prominence = avg_energy / (sum(np.mean(e) for e in band_aggregates.values()) + 1e-6)
        
        sonic_palette.append({
            'band': band,
            'frequency_range': f"{FREQUENCY_BANDS[band][0]}-{FREQUENCY_BANDS[band][1]}Hz",
            'energy': float(avg_energy),
            'prominence': float(prominence)
        })
    
    # Sort by prominence
    sonic_palette = sorted(sonic_palette, key=lambda x: x['prominence'], reverse=True)
    
    # Extract tonal characteristics
    avg_brightness = np.mean([f['brightness'] for f in all_features])
    avg_warmth = np.mean([f['warmth'] for f in all_features])
    avg_richness = np.mean([f['richness'] for f in all_features])
    
    tonal_characteristics = describe_tonal_profile(avg_brightness, avg_warmth, avg_richness)
    
    # Identify dominant frequencies (top 3 bands)
    dominant_frequencies = [
        {
            'band': sp['band'],
            'frequency_range': sp['frequency_range'],
            'prominence': round(sp['prominence'] * 100, 1)
        }
        for sp in sonic_palette[:3]
    ]
    
    # Generate marketing-grade style description
    style_description = generate_sonic_style_description(
        sonic_palette,
        tonal_characteristics,
        all_features,
        tracks_data
    )
    
    return {
        'styleDescription': style_description,
        'sonicPalette': sonic_palette,
        'tonalCharacteristics': tonal_characteristics,
        'dominantFrequencies': dominant_frequencies,
        'totalAnalyzed': len(all_features),
        'highQualityCount': len([f for f in all_features if f['energy'] >= 0.7]),
        'confidence': min(len(all_features) / 30, 1.0)
    }


def describe_tonal_profile(brightness, warmth, richness):
    """Generate sophisticated description of tonal characteristics"""
    
    descriptors = []
    
    # Brightness (spectral centroid)
    if brightness > 3000:
        descriptors.append('bright')
    elif brightness > 1500:
        descriptors.append('balanced')
    else:
        descriptors.append('dark')
    
    # Warmth (bass vs treble)
    if warmth > 2.0:
        descriptors.append('warm')
    elif warmth > 0.5:
        descriptors.append('neutral')
    else:
        descriptors.append('cool')
    
    # Richness (timbral complexity)
    if richness > 15:
        descriptors.append('complex')
    elif richness > 8:
        descriptors.append('textured')
    else:
        descriptors.append('minimal')
    
    return ', '.join(descriptors)


def generate_sonic_style_description(palette, tonal, features, tracks):
    """
    Generate marketing-grade sonic style description
    Like what Resident Advisor, Pitchfork, or a top music agency would say
    """
    
    # Calculate average energy
    avg_energy = np.mean([f['energy'] for f in features])
    avg_bpm = np.mean([f['bpm'] for f in features])
    
    # Primary aesthetic modifier based on energy
    if avg_energy >= 0.75:
        primary = "High-energy"
    elif avg_energy >= 0.55:
        primary = "Dynamic"
    elif avg_energy >= 0.35:
        primary = "Balanced"
    else:
        primary = "Atmospheric"
    
    # Frequency-based modifier (dominant band)
    dominant_band = palette[0]['band']
    
    frequency_modifiers = {
        'bass': 'bass-driven',
        'low_mid': 'warm and grounded',
        'mid': 'vocal-forward',
        'high_mid': 'crisp and articulate',
        'treble': 'bright and airy'
    }
    
    freq_mod = frequency_modifiers.get(dominant_band, 'sonically rich')
    
    # Tonal characteristic
    tonal_descriptors = tonal.split(', ')
    
    # BPM-based context
    if avg_bpm >= 140:
        tempo_context = "uptempo selections"
    elif avg_bpm >= 115:
        tempo_context = "mid-tempo grooves"
    elif avg_bpm >= 90:
        tempo_context = "steady-paced rhythms"
    else:
        tempo_context = "downtempo explorations"
    
    # Assemble final description
    description = f"{primary} {freq_mod} sonic palette across {tempo_context}"
    
    return description


def main():
    parser = argparse.ArgumentParser(description='Analyze sonic DNA from track collection')
    parser.add_argument('tracks_json', help='JSON file with track data')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    
    args = parser.parse_args()
    
    # Load track data
    with open(args.tracks_json, 'r') as f:
        tracks_data = json.load(f)
    
    # Analyze
    result = analyze_track_collection(tracks_data)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Style: {result['styleDescription']}")
        print(f"Tonal: {result['tonalCharacteristics']}")
        print(f"Dominant Frequencies: {', '.join(f['band'] for f in result['dominantFrequencies'])}")


if __name__ == '__main__':
    main()
