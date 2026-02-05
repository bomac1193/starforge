#!/usr/bin/env python3
"""
Sophisticated Visual DNA Analysis
Extracts color palettes, style profiles, and aesthetic signatures
from user's photo collection for marketing-grade insights.
"""

import sys
import json
import argparse
from pathlib import Path
from collections import Counter
import colorsys

try:
    from PIL import Image
    import numpy as np
    from sklearn.cluster import KMeans
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {e}"}))
    sys.exit(1)


def rgb_to_hex(rgb):
    """Convert RGB tuple to hex color code"""
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def get_color_name(rgb):
    """Get descriptive name for color based on HSV"""
    h, s, v = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
    h = h * 360

    # Saturation and value thresholds
    if s < 0.1:
        if v < 0.3:
            return "black"
        elif v > 0.7:
            return "white"
        else:
            return "grey"

    # Color hue ranges
    if h < 15 or h >= 345:
        return "red"
    elif h < 45:
        return "orange"
    elif h < 75:
        return "yellow"
    elif h < 165:
        return "green"
    elif h < 255:
        return "blue"
    elif h < 285:
        return "purple"
    elif h < 315:
        return "magenta"
    else:
        return "pink"


def extract_dominant_colors(image_path, n_colors=5):
    """Extract dominant colors from an image using k-means clustering"""
    try:
        img = Image.open(image_path)

        # Resize for faster processing
        img = img.resize((150, 150))

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Get pixel data
        pixels = np.array(img).reshape(-1, 3)

        # Use k-means to find dominant colors
        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)

        colors = kmeans.cluster_centers_
        labels = kmeans.labels_

        # Count occurrences to get dominance
        counts = Counter(labels)

        # Sort by dominance
        sorted_colors = []
        for i in sorted(counts, key=counts.get, reverse=True):
            rgb = colors[i]
            sorted_colors.append({
                'rgb': rgb.tolist(),
                'hex': rgb_to_hex(rgb),
                'name': get_color_name(rgb),
                'percentage': (counts[i] / len(labels)) * 100
            })

        return sorted_colors

    except Exception as e:
        return None


def analyze_photo_collection(photos_data):
    """
    Analyze entire photo collection to extract visual DNA

    Args:
        photos_data: List of dicts with 'path', 'score', 'tags'

    Returns:
        Visual DNA profile with colors, style, aesthetic
    """

    # Extract colors from top-rated photos
    all_colors = []
    style_tags = []

    # Prioritize highly-rated photos
    top_photos = sorted(photos_data, key=lambda p: p.get('score', 0), reverse=True)[:30]

    for photo in top_photos:
        path = photo.get('path')
        if not path or not Path(path).exists():
            continue

        colors = extract_dominant_colors(path, n_colors=3)
        if colors:
            # Weight colors by photo score
            score_weight = photo.get('score', 50) / 100
            for color in colors:
                all_colors.append({
                    **color,
                    'weight': color['percentage'] * score_weight
                })

        # Collect style tags
        tags = photo.get('tags', [])
        if tags:
            style_tags.extend(tags)

    # Aggregate colors
    color_aggregation = {}
    for color in all_colors:
        hex_code = color['hex']
        if hex_code in color_aggregation:
            color_aggregation[hex_code]['weight'] += color['weight']
        else:
            color_aggregation[hex_code] = color

    # Sort by weight and get top 5
    top_colors = sorted(
        color_aggregation.values(),
        key=lambda c: c['weight'],
        reverse=True
    )[:5]

    # Analyze color palette characteristics
    palette_description = describe_color_palette(top_colors)

    # Analyze style tags
    tag_counts = Counter(style_tags)
    top_tags = [tag for tag, _ in tag_counts.most_common(5)]

    # Generate sophisticated style description
    style_description = generate_style_description(top_tags, palette_description, top_photos)

    return {
        'styleDescription': style_description,
        'colorPalette': [
            {
                'hex': c['hex'],
                'name': c['name'],
                'weight': round(c['weight'], 2)
            }
            for c in top_colors
        ],
        'paletteCharacteristics': palette_description,
        'dominantThemes': top_tags,
        'totalAnalyzed': len(photos_data),
        'highRatedCount': len([p for p in photos_data if p.get('score', 0) >= 80]),
        'confidence': min(len(top_photos) / 30, 1.0)
    }


def describe_color_palette(colors):
    """Generate sophisticated description of color palette"""
    if not colors:
        return "neutral palette"

    # Get color names
    color_names = [c['name'] for c in colors]
    color_counts = Counter(color_names)

    # Check for monochrome
    if len(set(color_names)) <= 2:
        if 'black' in color_names or 'white' in color_names or 'grey' in color_names:
            return "monochrome"
        else:
            return "limited palette"

    # Check for warm vs cool
    warm_colors = {'red', 'orange', 'yellow', 'pink'}
    cool_colors = {'blue', 'green', 'purple'}

    warm_count = sum(1 for c in color_names if c in warm_colors)
    cool_count = sum(1 for c in color_names if c in cool_colors)

    if warm_count > cool_count * 2:
        return "warm-toned"
    elif cool_count > warm_count * 2:
        return "cool-toned"
    elif 'black' in color_names and 'white' in color_names:
        return "high-contrast"
    else:
        return "balanced"


def generate_style_description(tags, palette, photos):
    """
    Generate marketing-grade style description
    Like what Vogue, Dazed, or a top creative agency would say
    """

    # Calculate average score
    avg_score = sum(p.get('score', 50) for p in photos) / len(photos) if photos else 50

    # Build sophisticated description
    parts = []

    # Primary aesthetic modifier
    if avg_score >= 85:
        primary = "Refined"
    elif avg_score >= 70:
        primary = "Curated"
    elif avg_score >= 50:
        primary = "Evolving"
    else:
        primary = "Experimental"

    # Palette-based modifier
    palette_modifiers = {
        'monochrome': 'minimalist',
        'warm-toned': 'intimate',
        'cool-toned': 'atmospheric',
        'high-contrast': 'editorial',
        'balanced': 'versatile',
        'limited palette': 'focused'
    }

    palette_mod = palette_modifiers.get(palette, 'distinctive')

    # Build core style from tags
    if not tags:
        core_style = "visual aesthetic"
    else:
        # Map tags to sophisticated language
        tag_map = {
            'portrait': 'portraiture',
            'selfie': 'self-documentation',
            'food': 'culinary imagery',
            'group': 'social narratives',
            'outdoor': 'environmental contexts',
            'indoor': 'interior studies',
            'city': 'urban documentation',
            'nature': 'naturalism',
            'artistic': 'conceptual work',
            'action': 'kinetic energy',
            'event': 'event documentation'
        }

        primary_tag = tag_map.get(tags[0], tags[0]) if tags else 'visual work'

        if len(tags) > 1:
            secondary_tag = tag_map.get(tags[1], tags[1])
            core_style = f"{primary_tag} with {secondary_tag} influences"
        else:
            core_style = f"{primary_tag}-driven aesthetic"

    # Assemble final description
    description = f"{primary} {palette_mod} {core_style}"

    return description


def main():
    parser = argparse.ArgumentParser(description='Analyze visual DNA from photo collection')
    parser.add_argument('photos_json', help='JSON file with photo data')
    parser.add_argument('--json', action='store_true', help='Output JSON')

    args = parser.parse_args()

    # Load photo data
    with open(args.photos_json, 'r') as f:
        photos_data = json.load(f)

    # Analyze
    result = analyze_photo_collection(photos_data)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Style: {result['styleDescription']}")
        print(f"Color Palette: {', '.join(c['hex'] for c in result['colorPalette'])}")
        print(f"Themes: {', '.join(result['dominantThemes'])}")


if __name__ == '__main__':
    main()
