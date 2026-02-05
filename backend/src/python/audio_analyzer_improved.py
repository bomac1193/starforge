#!/usr/bin/env python3
"""
Improved audio analyzer with multiple energy calculation methods
Compares: Current (basic RMS) vs Improved (loudness-normalized) vs Essentia
"""

import sys
import json
import numpy as np
import librosa

def analyze_audio_improved(audio_path):
    """
    Improved energy calculation using librosa
    - Excludes quiet sections
    - Uses spectral flux for perceived energy
    - Applies loudness normalization
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # Basic features (same as before)
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

        # Chromagram for key
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_avg = np.mean(chroma, axis=1)
        dominant_pitch = np.argmax(chroma_avg)
        pitch_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key = pitch_names[dominant_pitch] + ' major'

        # IMPROVED ENERGY CALCULATION
        # 1. RMS energy per frame
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]

        # 2. Exclude quiet sections (below threshold)
        # Calculate dynamic threshold based on track's own loudness distribution
        rms_db = librosa.amplitude_to_db(rms, ref=np.max)
        threshold_db = np.percentile(rms_db, 25)  # Ignore quietest 25%
        mask = rms_db > threshold_db

        if np.any(mask):
            active_rms = rms[mask]
        else:
            active_rms = rms

        # 3. Calculate energy from active sections only
        improved_energy = np.mean(active_rms)

        # 4. Also calculate spectral flux (perceived energy)
        spectral_flux = librosa.onset.onset_strength(y=y, sr=sr)
        spectral_energy = np.mean(spectral_flux) / 10.0  # Normalize

        # 5. Combine RMS and spectral flux (weighted)
        combined_energy = (improved_energy * 0.6) + (spectral_energy * 0.4)

        # 6. Apply loudness normalization (scale to 0-1 range)
        # Typical RMS values range from 0.001 (very quiet) to 0.5 (very loud)
        # Apply log scaling for perceptual loudness
        if combined_energy > 0:
            normalized_energy = min(1.0, np.log10(combined_energy + 0.01) / np.log10(0.51) + 1)
        else:
            normalized_energy = 0

        # Valence estimation
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        brightness = np.mean(spectral_centroids) / (sr / 2)
        rolloff_norm = np.mean(spectral_rolloff) / (sr / 2)
        valence = (brightness * 0.5) + (rolloff_norm * 0.5)

        # Loudness
        loudness_db = librosa.amplitude_to_db(np.mean(active_rms))

        result = {
            'duration': float(duration),
            'bpm': float(tempo),
            'key': key,
            'energy': float(normalized_energy),
            'energy_raw': float(improved_energy),
            'energy_spectral': float(spectral_energy),
            'valence': float(valence),
            'loudness': float(loudness_db),
            'method': 'improved_librosa'
        }

        return result

    except Exception as e:
        return {'error': str(e), 'method': 'improved_librosa'}


def analyze_audio_essentia(audio_path):
    """
    Essentia-based energy calculation (if available)
    Uses more sophisticated algorithms for energy and danceability
    """
    try:
        import essentia.standard as es

        # Load audio
        audio = es.MonoLoader(filename=audio_path)()

        # Rhythm features
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

        # Energy and loudness
        # Use ReplayGain for standardized loudness
        replay_gain = es.ReplayGain()
        rg_value = replay_gain(audio)

        # Dynamic complexity (energy variation)
        dynamic_complexity = es.DynamicComplexity()
        complexity = dynamic_complexity(audio)

        # Danceability
        danceability_extractor = es.Danceability()
        danceability, dfa = danceability_extractor(audio)

        # Spectral energy
        spectrum = es.Spectrum()
        windowing = es.Windowing(type='hann')

        spectral_energies = []
        for frame in es.FrameGenerator(audio, frameSize=2048, hopSize=512):
            spec = spectrum(windowing(frame))
            energy = es.Energy()(spec)
            spectral_energies.append(energy)

        avg_spectral_energy = np.mean(spectral_energies)

        # Combine metrics for final energy score
        # Essentia's energy is typically in the range [0, 10+]
        # Normalize to 0-1 scale
        normalized_energy = min(1.0, avg_spectral_energy / 0.1)

        # Key detection
        key_extractor = es.KeyExtractor()
        key, scale, strength = key_extractor(audio)
        key_full = f"{key} {scale}"

        result = {
            'duration': float(len(audio) / 44100),
            'bpm': float(bpm),
            'key': key_full,
            'energy': float(normalized_energy),
            'danceability': float(danceability),
            'loudness': float(rg_value),
            'dynamic_complexity': float(complexity),
            'method': 'essentia'
        }

        return result

    except ImportError:
        return {'error': 'Essentia not installed', 'method': 'essentia'}
    except Exception as e:
        return {'error': str(e), 'method': 'essentia'}


def analyze_audio_current(audio_path):
    """
    Current basic method (for comparison)
    """
    try:
        y, sr = librosa.load(audio_path, sr=None)

        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        rms = librosa.feature.rms(y=y)[0]
        energy = np.mean(rms)  # Basic average

        result = {
            'bpm': float(tempo),
            'energy': float(energy),
            'method': 'current_basic'
        }

        return result

    except Exception as e:
        return {'error': str(e), 'method': 'current_basic'}


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No audio file provided'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    method = sys.argv[2] if len(sys.argv) > 2 else 'improved'

    if method == 'current':
        result = analyze_audio_current(audio_path)
    elif method == 'improved':
        result = analyze_audio_improved(audio_path)
    elif method == 'essentia':
        result = analyze_audio_essentia(audio_path)
    else:
        result = {'error': f'Unknown method: {method}'}

    print(json.dumps(result))
