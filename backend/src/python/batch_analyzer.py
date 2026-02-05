#!/usr/bin/env python3
"""
Parallel batch audio analyzer for fast processing of multiple tracks
Uses multiprocessing to analyze tracks simultaneously
"""

import sys
import json
import argparse
from multiprocessing import Pool, cpu_count
from pathlib import Path
import importlib.util

# Import audio_analyzer module
spec = importlib.util.spec_from_file_location("audio_analyzer", Path(__file__).parent / "audio_analyzer.py")
audio_analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio_analyzer)

def analyze_single_track(args):
    """
    Analyze a single track (wrapper for multiprocessing)
    Returns: (track_id, result_dict)
    """
    track_id, audio_path = args
    try:
        result = audio_analyzer.analyze_audio(audio_path, include_quality=False, detect_highlights=False)
        return (track_id, result)
    except Exception as e:
        return (track_id, {'error': str(e)})

def analyze_batch(tracks, num_workers=None):
    """
    Analyze multiple tracks in parallel

    Args:
        tracks: List of (track_id, audio_path) tuples
        num_workers: Number of parallel workers (default: CPU count - 1)

    Returns:
        Dictionary mapping track_id -> analysis results
    """
    if num_workers is None:
        num_workers = max(1, cpu_count() - 1)  # Leave 1 core free

    # Use multiprocessing pool for parallel analysis
    with Pool(processes=num_workers) as pool:
        results = pool.map(analyze_single_track, tracks)

    # Convert list of tuples to dictionary
    return dict(results)

def main():
    parser = argparse.ArgumentParser(description='Batch analyze audio files in parallel')
    parser.add_argument('tracks_json', help='JSON file with track list: [{"id": "track1", "path": "/path/to/file"}, ...]')
    parser.add_argument('--workers', type=int, default=None, help='Number of parallel workers')
    parser.add_argument('--output', help='Output JSON file (default: stdout)')

    args = parser.parse_args()

    # Load tracks from JSON file
    with open(args.tracks_json, 'r') as f:
        tracks_data = json.load(f)

    # Convert to (id, path) tuples
    tracks = [(t['id'], t['path']) for t in tracks_data]

    print(f"Analyzing {len(tracks)} tracks using {args.workers or (cpu_count() - 1)} workers...", file=sys.stderr)

    # Run batch analysis
    results = analyze_batch(tracks, num_workers=args.workers)

    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results written to {args.output}", file=sys.stderr)
    else:
        print(json.dumps(results, indent=2))

    # Print summary
    success_count = sum(1 for r in results.values() if 'error' not in r)
    error_count = len(results) - success_count
    print(f"\n✓ Success: {success_count}, ✗ Errors: {error_count}", file=sys.stderr)

if __name__ == '__main__':
    main()
