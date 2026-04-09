#!/usr/bin/env python3
"""
Sophisticated Visual DNA Analysis
Extracts color palettes, style profiles, and aesthetic signatures
from user's photo collection for marketing-grade insights.
"""

import sys
import json
import argparse
import math
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


def rgb_to_hsv(rgb):
    """Convert RGB (0-255) to HSV (h=0-360, s=0-1, v=0-1)"""
    h, s, v = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
    return h * 360, s, v


def is_near_black(rgb, threshold=0.15):
    """Check if a color is near-black based on HSV value"""
    _, _, v = rgb_to_hsv(rgb)
    return v < threshold


def is_near_white(rgb):
    """Check if a color is near-white (high value, low saturation)"""
    _, s, v = rgb_to_hsv(rgb)
    return v > 0.95 and s < 0.1


def get_color_name(rgb):
    """Get descriptive name for color based on HSV with dark color support"""
    h, s, v = rgb_to_hsv(rgb)

    # Very dark colors — catch these first regardless of saturation
    if v < 0.15:
        return "black"

    # Dark but visible colors
    if v < 0.35:
        if s < 0.15:
            return "charcoal"
        # Has hue — describe as "dark {hue}"
        hue_name = _hue_name(h)
        return f"dark {hue_name}"

    # Achromatic (low saturation)
    if s < 0.1:
        if v > 0.7:
            return "white"
        return "grey"

    # Full color classification
    hue_name = _hue_name(h)

    # Add brightness qualifier
    if v < 0.55:
        return f"deep {hue_name}"
    elif v > 0.85 and s > 0.5:
        return f"bright {hue_name}"
    elif s < 0.35:
        return f"muted {hue_name}"

    return hue_name


def _hue_name(h):
    """Map hue angle to color name"""
    if h < 15 or h >= 345:
        return "red"
    elif h < 30:
        return "vermillion"
    elif h < 45:
        return "orange"
    elif h < 60:
        return "amber"
    elif h < 75:
        return "yellow"
    elif h < 105:
        return "chartreuse"
    elif h < 135:
        return "green"
    elif h < 165:
        return "teal"
    elif h < 195:
        return "cyan"
    elif h < 225:
        return "azure"
    elif h < 255:
        return "blue"
    elif h < 285:
        return "purple"
    elif h < 315:
        return "magenta"
    else:
        return "rose"


def rgb_distance(rgb1, rgb2):
    """Euclidean distance between two RGB colors"""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))


def deduplicate_colors(colors, min_distance=30):
    """Merge colors that are very similar (within min_distance in RGB space)"""
    if not colors:
        return colors

    merged = [colors[0]]
    for color in colors[1:]:
        is_duplicate = False
        for existing in merged:
            if rgb_distance(color['rgb'], existing['rgb']) < min_distance:
                # Merge into the higher-weight one
                existing['weight'] += color['weight']
                existing['percentage'] += color['percentage']
                is_duplicate = True
                break
        if not is_duplicate:
            merged.append(color)

    return merged


def extract_dominant_colors(image_path, n_colors=8):
    """Extract dominant colors from an image using k-means clustering.
    Uses 8 initial clusters and filters near-black/near-white for better results.
    """
    try:
        img = Image.open(image_path)

        # Resize for faster processing
        img = img.resize((150, 150))

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Get pixel data
        pixels = np.array(img).reshape(-1, 3)

        # Use k-means to find dominant colors (more clusters for better filtering)
        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)

        colors = kmeans.cluster_centers_
        labels = kmeans.labels_

        # Count occurrences to get dominance
        counts = Counter(labels)

        # Build color list
        all_cluster_colors = []
        for i in sorted(counts, key=counts.get, reverse=True):
            rgb = colors[i]
            all_cluster_colors.append({
                'rgb': rgb.tolist(),
                'hex': rgb_to_hex(rgb),
                'name': get_color_name(rgb),
                'percentage': (counts[i] / len(labels)) * 100
            })

        # Filter near-black and near-white
        filtered = [c for c in all_cluster_colors
                     if not is_near_black(c['rgb']) and not is_near_white(c['rgb'])]

        # If all colors were filtered (very dark photo), relax threshold
        if len(filtered) < 2:
            filtered = [c for c in all_cluster_colors
                         if not is_near_black(c['rgb'], threshold=0.08)]

        # If still empty, take the brightest cluster(s)
        if not filtered:
            by_brightness = sorted(all_cluster_colors,
                                    key=lambda c: colorsys.rgb_to_hsv(c['rgb'][0]/255, c['rgb'][1]/255, c['rgb'][2]/255)[2],
                                    reverse=True)
            filtered = by_brightness[:3]

        return filtered[:5]

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

        colors = extract_dominant_colors(path, n_colors=8)
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

    # Filter near-black from aggregated pool before deduplication
    all_colors = [c for c in all_colors if not is_near_black(c['rgb'])]

    # If too few colors after filtering, relax threshold
    if len(all_colors) < 5:
        # Re-run without filter — use original extraction which already filtered per-image
        pass  # all_colors already has per-image filtering applied

    # Aggregate colors by hex
    color_aggregation = {}
    for color in all_colors:
        hex_code = color['hex']
        if hex_code in color_aggregation:
            color_aggregation[hex_code]['weight'] += color['weight']
        else:
            color_aggregation[hex_code] = {**color}

    # Sort by weight
    sorted_colors = sorted(
        color_aggregation.values(),
        key=lambda c: c['weight'],
        reverse=True
    )

    # Deduplicate similar colors
    sorted_colors = deduplicate_colors(sorted_colors, min_distance=30)

    # Get top 5
    top_colors = sorted_colors[:5]

    # Analyze color palette characteristics
    palette_description = describe_color_palette(top_colors)

    # Analyze style tags
    tag_counts = Counter(style_tags)
    top_tags = [tag for tag, _ in tag_counts.most_common(5)]

    # Generate sophisticated style description
    style_description = generate_style_description(top_tags, palette_description, top_photos, top_colors)

    total_weight = sum(c['weight'] for c in top_colors) or 1
    return {
        'styleDescription': style_description,
        'colorPalette': [
            {
                'hex': c['hex'],
                'name': c['name'],
                'weight': round(c['weight'], 2),
                'percentage': round(c['weight'] / total_weight * 100, 1)
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
        return {"type": "neutral palette", "warmth": "neutral", "saturation": "balanced"}

    # Analyze HSV properties across palette
    warm_count = 0
    cool_count = 0
    total_saturation = 0
    total_value = 0

    warm_hues = set()
    cool_hues = set()

    for c in colors:
        h, s, v = rgb_to_hsv(c['rgb'])
        total_saturation += s
        total_value += v

        # Classify warm vs cool
        if (h < 60 or h >= 300):  # reds, oranges, yellows, magentas
            warm_count += 1
            warm_hues.add(c['name'])
        elif (60 <= h < 300):  # greens, blues, purples
            cool_count += 1
            cool_hues.add(c['name'])

    n = len(colors)
    avg_saturation = total_saturation / n
    avg_value = total_value / n

    # Determine palette type
    if warm_count > cool_count * 2:
        palette_type = "warm-toned"
        warmth = "warm"
    elif cool_count > warm_count * 2:
        palette_type = "cool-toned"
        warmth = "cool"
    elif avg_value < 0.35:
        palette_type = "shadow-forward"
        warmth = "warm" if warm_count >= cool_count else "cool"
    elif avg_saturation < 0.2:
        palette_type = "muted earth"
        warmth = "neutral"
    elif avg_saturation > 0.6:
        palette_type = "vivid"
        warmth = "warm" if warm_count >= cool_count else "cool"
    else:
        palette_type = "balanced"
        warmth = "neutral"

    # Saturation descriptor
    if avg_saturation > 0.6:
        sat_desc = "vibrant"
    elif avg_saturation > 0.35:
        sat_desc = "moderate"
    elif avg_saturation > 0.15:
        sat_desc = "muted"
    else:
        sat_desc = "desaturated"

    return {
        "type": palette_type,
        "warmth": warmth,
        "saturation": sat_desc,
        "avg_saturation": round(avg_saturation, 2),
        "avg_value": round(avg_value, 2),
        "warm_count": warm_count,
        "cool_count": cool_count,
    }


def generate_style_description(tags, palette_info, photos, top_colors):
    """
    Generate marketing-grade style description using actual color data
    and photo characteristics.
    """

    # Calculate average score
    avg_score = sum(p.get('score', 50) for p in photos) / len(photos) if photos else 50

    parts = []

    # Primary aesthetic modifier from curation quality
    if avg_score >= 85:
        primary = "Refined"
    elif avg_score >= 70:
        primary = "Curated"
    elif avg_score >= 50:
        primary = "Evolving"
    else:
        primary = "Experimental"

    # Color-informed modifier (uses actual palette analysis, not just tags)
    palette_type = palette_info.get("type", "balanced") if isinstance(palette_info, dict) else palette_info
    saturation = palette_info.get("saturation", "balanced") if isinstance(palette_info, dict) else "balanced"

    palette_modifiers = {
        'shadow-forward': 'chiaroscuro',
        'warm-toned': 'intimate',
        'cool-toned': 'atmospheric',
        'vivid': 'saturated',
        'muted earth': 'earth-toned',
        'balanced': 'versatile',
    }

    palette_mod = palette_modifiers.get(palette_type, 'distinctive')

    # Build color description from actual palette
    color_names = [c['name'] for c in top_colors] if top_colors else []
    unique_color_names = list(dict.fromkeys(color_names))  # Deduplicate, preserve order

    # Build core style from tags
    if not tags:
        core_style = "visual aesthetic"
    else:
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

    # Assemble final description with color detail
    description = f"{primary} {palette_mod} {core_style}"

    # Append actual color signature
    if unique_color_names:
        # Take top 3 most distinct color names
        signature_colors = unique_color_names[:3]
        color_str = ", ".join(signature_colors)
        description += f". Palette anchored in {color_str}."

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
