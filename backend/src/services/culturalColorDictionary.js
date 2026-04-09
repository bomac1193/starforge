/**
 * Cultural Color Dictionary
 *
 * Maps hex colors to culturally/historically significant color names
 * using perceptually uniform LAB Delta E distance matching.
 *
 * Psychometric alignment: matches closest cultural reference regardless
 * of region. African, Latin American, Asian, and Western traditions
 * weighted equally — the algorithm finds the best match, not the
 * "closest geographic" match.
 */

const path = require('path');
const fs = require('fs');

// Load cultural colors from JSON
const COLORS_PATH = path.join(__dirname, '..', 'data', 'cultural_colors.json');
let culturalColors = [];

try {
  culturalColors = JSON.parse(fs.readFileSync(COLORS_PATH, 'utf8'));
} catch (err) {
  console.error('Failed to load cultural_colors.json:', err.message);
}

// Pre-compute LAB values for all dictionary colors
const colorIndex = culturalColors.map(c => ({
  ...c,
  lab: hexToLab(c.hex),
}));

/**
 * Convert hex string to RGB array [0-255]
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Convert RGB [0-255] to CIE XYZ
 */
function rgbToXyz(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  // sRGB gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  ];
}

/**
 * Convert CIE XYZ to CIE LAB (D65 illuminant)
 */
function xyzToLab(xyz) {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x = xyz[0] / refX;
  let y = xyz[1] / refY;
  let z = xyz[2] / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  return [
    116 * y - 16,     // L
    500 * (x - y),    // a
    200 * (y - z),    // b
  ];
}

/**
 * Convert hex to LAB
 */
function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

/**
 * CIE76 Delta E — perceptually uniform color distance
 */
function deltaE(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  );
}

/**
 * Match a hex color to the closest cultural color reference.
 *
 * @param {string} hex - Color to match (e.g. "#4f315a")
 * @returns {object|null} Best match with name, origin, context, distance
 */
function matchColor(hex) {
  if (!hex || colorIndex.length === 0) return null;

  const targetLab = hexToLab(hex);
  let bestMatch = null;
  let bestDist = Infinity;

  for (const entry of colorIndex) {
    const dist = deltaE(targetLab, entry.lab);

    // Only match if within the entry's radius
    if (dist < bestDist && dist <= entry.radius) {
      bestDist = dist;
      bestMatch = entry;
    }
  }

  if (!bestMatch) return null;

  return {
    name: bestMatch.name,
    origin: bestMatch.origin,
    hex: bestMatch.hex,
    context: bestMatch.context,
    distance: Math.round(bestDist * 10) / 10,
  };
}

/**
 * Match a hex color and return result or fallback to generic name.
 *
 * @param {string} hex - Color to match
 * @param {string} genericName - Fallback name if no cultural match
 * @returns {object} Always returns { name, origin, context, hex, matched }
 */
function matchColorOrFallback(hex, genericName) {
  const match = matchColor(hex);
  if (match) {
    return { ...match, matched: true };
  }
  return {
    name: genericName || hex,
    origin: null,
    hex: hex,
    context: null,
    distance: null,
    matched: false,
  };
}

/**
 * Match an entire palette (array of hex strings) to cultural references.
 *
 * @param {Array<{hex: string, name?: string}>} palette - Color palette entries
 * @returns {Array} Palette with cultural names added
 */
function matchPalette(palette) {
  if (!palette || !Array.isArray(palette)) return [];

  return palette.map(entry => {
    const hex = entry.hex || entry;
    const result = matchColorOrFallback(hex, entry.name || null);
    return {
      hex: hex,
      culturalName: result.name,
      origin: result.origin,
      context: result.context,
      distance: result.distance,
      matched: result.matched,
      genericName: entry.name || null,
      percentage: entry.percentage || null,
    };
  });
}

/**
 * Get all cultural colors (for debugging/display)
 */
function getAllColors() {
  return culturalColors;
}

module.exports = {
  matchColor,
  matchColorOrFallback,
  matchPalette,
  getAllColors,
  hexToLab,
  deltaE,
};
