#!/usr/bin/env python3
"""
Accurate BPM detection using Essentia
More reliable than librosa for complex rhythms
"""

import sys
import json

try:
    import essentia.standard as es
except ImportError:
    print(json.dumps({"error": "Essentia not installed"}))
    sys.exit(1)

def detect_bpm_essentia(audio_path):
    """
    Detect BPM using Essentia's RhythmExtractor2013
    More accurate than librosa, especially for electronic music
    """
    try:
        # Load audio
        audio = es.MonoLoader(filename=audio_path)()

        # Rhythm extraction
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

        return {
            "bpm": float(bpm),
            "confidence": float(beats_confidence),
            "method": "essentia"
        }
    except Exception as e:
        return {"error": str(e), "method": "essentia"}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No audio file provided'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    result = detect_bpm_essentia(audio_path)
    print(json.dumps(result))
