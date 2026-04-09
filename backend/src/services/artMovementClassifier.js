/**
 * Art Movement Classifier
 *
 * Uses high-signal photos (best, favourites, star-rated) from Tizita
 * to compute more accurate art movement affinities.
 *
 * Signal hierarchy:
 *   best_photo  = weight 3.0 (user's peak identity)
 *   favorite    = weight 2.0 (strong preference)
 *   rating >= 4 = weight 1.5 (liked)
 *   rating <= 2 = weight -1.0 (anti-signal)
 *
 * Characteristics are computed PER-PHOTO and then weighted-averaged,
 * rather than computing from a single centroid (which kills variance
 * and produces artificially low energy for all users).
 */

const tizitaDirectService = require('./tizitaServiceDirect');

/**
 * Parse a SigLIP embedding from SQLite binary blob to Float32Array
 */
function parseEmbedding(buffer) {
  if (!buffer || buffer.length === 0) return null;
  try {
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  } catch {
    return null;
  }
}

/**
 * Compute weighted centroid from photos with embeddings
 */
function computeWeightedCentroid(photoGroups) {
  const dim = 768;
  const centroid = new Float64Array(dim);
  let totalWeight = 0;

  for (const { photos, weight } of photoGroups) {
    for (const photo of photos) {
      const emb = parseEmbedding(photo.siglip_embedding);
      if (!emb || emb.length !== dim) continue;

      for (let i = 0; i < dim; i++) {
        centroid[i] += emb[i] * weight;
      }
      totalWeight += Math.abs(weight);
    }
  }

  if (totalWeight === 0) return null;

  // Normalize
  for (let i = 0; i < dim; i++) {
    centroid[i] /= totalWeight;
  }

  return centroid;
}

/**
 * Extract visual characteristics from a single embedding vector.
 * Used per-photo before averaging.
 */
function extractSingleCharacteristics(vec) {
  const dim = vec.length;
  const lowLevel = vec.slice(0, 256);
  const midLevel = vec.slice(256, 512);
  const highLevel = vec.slice(512);

  // Warmth: early dimensions (mean of first 128)
  const warmthDims = vec.slice(0, 128);
  const warmthMean = warmthDims.reduce((a, b) => a + b, 0) / warmthDims.length;
  const warmth = Math.max(0, Math.min(1, 0.5 + warmthMean * 2));

  // For single embeddings, use dimension-range features instead of overall std
  // (SigLIP std is ~0.036 for ALL photos — useless for differentiation)

  // Energy: magnitude range of high-level features (captures visual intensity)
  const highRange = highLevel.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
  const energy = Math.max(0, Math.min(1, highRange * 10));

  // Contrast: difference between max and min across ALL dimensions
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < dim; i++) {
    if (vec[i] < min) min = vec[i];
    if (vec[i] > max) max = vec[i];
  }
  const contrast = Math.max(0, Math.min(1, (max - min) * 2.5));

  // Complexity: count of dimensions with significant absolute value
  // (how many features are "active")
  const threshold = 0.02;
  let activeCount = 0;
  for (let i = 0; i < dim; i++) {
    if (Math.abs(vec[i]) > threshold) activeCount++;
  }
  const complexity = Math.max(0, Math.min(1, activeCount / dim));

  // Symmetry: correlation between first and second half of mid-level
  const midA = midLevel.slice(0, 128);
  const midB = midLevel.slice(128, 256);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < 128; i++) {
    dot += midA[i] * midB[i];
    normA += midA[i] * midA[i];
    normB += midB[i] * midB[i];
  }
  const cosine = (normA > 0 && normB > 0) ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  const symmetry = Math.max(0, Math.min(1, (cosine + 1) / 2)); // Map [-1,1] to [0,1]

  // Organic vs geometric: ratio of smooth (low-freq) to sharp (high-freq) features
  const lowMean = Math.abs(lowLevel.reduce((a, b) => a + b, 0) / lowLevel.length);
  const highMean = Math.abs(highLevel.reduce((a, b) => a + b, 0) / highLevel.length);
  const organicRaw = highMean / (lowMean + highMean + 1e-8);
  const organic = Math.max(0, Math.min(1, organicRaw * 2));
  const geometric = 1 - organic;

  return { warmth, energy, contrast, complexity, symmetry, organic, geometric };
}

/**
 * Compute weighted average of per-photo characteristics.
 * This preserves per-photo variance that gets lost in centroid averaging.
 */
function computeWeightedCharacteristics(photoGroups) {
  const accumulator = { warmth: 0, energy: 0, contrast: 0, complexity: 0, symmetry: 0, organic: 0, geometric: 0 };
  let totalWeight = 0;

  for (const { photos, weight } of photoGroups) {
    const absWeight = Math.abs(weight);
    const sign = weight >= 0 ? 1 : -1;

    for (const photo of photos) {
      const emb = parseEmbedding(photo.siglip_embedding);
      if (!emb || emb.length !== 768) continue;

      const chars = extractSingleCharacteristics(emb);

      for (const key of Object.keys(accumulator)) {
        // For anti-signals (negative weight), invert the contribution
        accumulator[key] += chars[key] * absWeight * sign;
      }
      totalWeight += absWeight;
    }
  }

  if (totalWeight === 0) return null;

  // Normalize and clamp
  const result = {};
  for (const key of Object.keys(accumulator)) {
    result[key] = Math.max(0, Math.min(1, accumulator[key] / totalWeight));
  }

  return result;
}

/**
 * Also compute embedding diversity as an additional energy signal.
 * High diversity = eclectic taste = more energy/dynamism.
 */
function computeEmbeddingDiversity(photoGroups) {
  // Collect all positive-signal embeddings
  const embeddings = [];
  for (const { photos, weight } of photoGroups) {
    if (weight <= 0) continue;
    for (const photo of photos) {
      const emb = parseEmbedding(photo.siglip_embedding);
      if (emb && emb.length === 768) embeddings.push(emb);
    }
  }

  if (embeddings.length < 3) return 0.5; // Not enough data

  // Compute average pairwise cosine distance (sample up to 200 for speed)
  const sample = embeddings.length > 200
    ? embeddings.sort(() => Math.random() - 0.5).slice(0, 200)
    : embeddings;

  let totalDist = 0;
  let pairs = 0;

  for (let i = 0; i < sample.length; i++) {
    // Compare to 10 random others for O(n) instead of O(n^2)
    const numCompare = Math.min(10, sample.length - 1);
    for (let j = 0; j < numCompare; j++) {
      const k = (i + 1 + j) % sample.length;
      let dot = 0, normA = 0, normB = 0;
      for (let d = 0; d < 768; d++) {
        dot += sample[i][d] * sample[k][d];
        normA += sample[i][d] * sample[i][d];
        normB += sample[k][d] * sample[k][d];
      }
      const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
      totalDist += 1 - cosine; // cosine distance
      pairs++;
    }
  }

  const avgDist = totalDist / (pairs || 1);
  // Typical cosine distances for photos: 0.1 (very similar) to 0.8 (very different)
  return Math.max(0, Math.min(1, avgDist * 2.5));
}

/**
 * Score art movements from characteristics
 * Same movement set as Tizita's calculate_deep_analysis
 */
function scoreMovements(chars) {
  const { warmth, energy, contrast, complexity, symmetry, organic, geometric } = chars;
  const scores = {};

  // Western
  scores["Bauhaus"] = (contrast * 0.4) + (geometric * 0.3) + ((1 - energy) * 0.3);
  scores["Brutalism"] = (contrast * 0.5) + ((1 - warmth) * 0.3) + (geometric * 0.2);
  scores["Memphis"] = (energy * 0.4) + (warmth * 0.3) + (complexity * 0.3);
  scores["Minimalism"] = ((1 - energy) * 0.4) + ((1 - contrast) * 0.3) + ((1 - complexity) * 0.3);
  scores["Swiss Design"] = (contrast * 0.3) + (geometric * 0.4) + ((1 - warmth) * 0.3);
  scores["Art Deco"] = (warmth * 0.3) + (contrast * 0.3) + (geometric * 0.4);
  scores["Art Nouveau"] = (organic * 0.4) + (warmth * 0.3) + (complexity * 0.3);

  // Japanese
  scores["Wabi-sabi"] = ((1 - energy) * 0.3) + ((1 - contrast) * 0.3) + (organic * 0.2) + (warmth * 0.2);
  scores["Ma (Negative Space)"] = ((1 - energy) * 0.5) + ((1 - complexity) * 0.3) + (symmetry * 0.2);
  scores["Kanso (Simplicity)"] = ((1 - complexity) * 0.4) + ((1 - energy) * 0.3) + ((1 - contrast) * 0.3);

  // African
  scores["Kente Aesthetic"] = (energy * 0.3) + (warmth * 0.3) + (contrast * 0.2) + (geometric * 0.2);
  scores["Ndebele Geometric"] = (contrast * 0.4) + (geometric * 0.3) + (energy * 0.3);
  scores["Ankara/African Print"] = (energy * 0.4) + (warmth * 0.3) + (complexity * 0.3);
  scores["Adinkra (Ashanti Symbol)"] = (geometric * 0.4) + (symmetry * 0.3) + ((1 - energy) * 0.3);
  scores["Nsibidi (Igbo Script)"] = (geometric * 0.3) + ((1 - energy) * 0.3) + (contrast * 0.2) + (organic * 0.2);
  scores["Ba-ila Fractal (Zambia)"] = (geometric * 0.3) + (symmetry * 0.2) + (complexity * 0.3) + (organic * 0.2);
  scores["Bogolan/Mudcloth (Mali)"] = (warmth * 0.3) + ((1 - energy) * 0.3) + (organic * 0.2) + (contrast * 0.2);
  scores["Adire (Yoruba Indigo)"] = ((1 - energy) * 0.3) + (organic * 0.3) + (contrast * 0.2) + ((1 - warmth) * 0.2);
  scores["Tingatinga (Tanzania)"] = (energy * 0.3) + (warmth * 0.3) + (organic * 0.2) + (contrast * 0.2);

  // Middle Eastern
  scores["Islamic Geometric"] = (geometric * 0.5) + (symmetry * 0.3) + ((1 - organic) * 0.2);
  scores["Arabesque"] = (organic * 0.3) + (complexity * 0.4) + (symmetry * 0.3);
  scores["Persian Miniature"] = (complexity * 0.4) + (warmth * 0.3) + (energy * 0.3);

  // East Asian
  scores["Shan Shui (Chinese Landscape)"] = (organic * 0.4) + ((1 - energy) * 0.3) + ((1 - contrast) * 0.3);
  scores["Dancheong (Korean)"] = (warmth * 0.3) + (contrast * 0.3) + (geometric * 0.2) + (complexity * 0.2);
  scores["Shibori (Japanese Dye)"] = (organic * 0.3) + ((1 - energy) * 0.3) + ((1 - contrast) * 0.2) + (complexity * 0.2);
  scores["Ukiyo-e (Japanese Woodblock)"] = (contrast * 0.3) + (organic * 0.3) + (warmth * 0.2) + (complexity * 0.2);
  scores["Batik (Indonesian)"] = (complexity * 0.3) + (organic * 0.3) + (warmth * 0.2) + (symmetry * 0.2);

  // South Asian
  scores["Madhubani"] = (complexity * 0.4) + (warmth * 0.3) + (organic * 0.3);
  scores["Mughal Miniature"] = (complexity * 0.4) + (warmth * 0.3) + (symmetry * 0.3);
  scores["Rangoli"] = (geometric * 0.3) + (symmetry * 0.4) + (warmth * 0.3);
  scores["Warli (Maharashtra)"] = ((1 - complexity) * 0.3) + (geometric * 0.3) + ((1 - energy) * 0.2) + (organic * 0.2);
  scores["Jali (Lattice Screen)"] = (geometric * 0.4) + (symmetry * 0.3) + ((1 - energy) * 0.3);

  // Latin American
  scores["Muralism"] = (energy * 0.3) + (warmth * 0.3) + (contrast * 0.2) + (complexity * 0.2);
  scores["Magical Realism"] = (organic * 0.3) + (warmth * 0.3) + (complexity * 0.4);
  scores["Tropicalia (Brazilian)"] = (energy * 0.4) + (warmth * 0.3) + (organic * 0.3);
  scores["Neo-concretismo (Brazilian)"] = (geometric * 0.3) + (energy * 0.3) + (contrast * 0.2) + ((1 - complexity) * 0.2);
  scores["Torres-Garcia Universalism"] = (geometric * 0.3) + (symmetry * 0.3) + (warmth * 0.2) + ((1 - energy) * 0.2);
  scores["Mola (Guna/Kuna Textile)"] = (contrast * 0.3) + (complexity * 0.3) + (warmth * 0.2) + (geometric * 0.2);

  return scores;
}

/**
 * Classify art movements using high-signal photos from Tizita
 *
 * Returns top 7 movements with affinities, plus metadata about signal sources
 */
function classifyMovements() {
  const bestPhotos = tizitaDirectService.getBestPhotos();
  const favPhotos = tizitaDirectService.getFavoritePhotos();
  const highRated = tizitaDirectService.getHighRatedPhotos(4);
  const lowRated = tizitaDirectService.getLowRatedPhotos(2);

  const totalSignalPhotos = bestPhotos.length + favPhotos.length + highRated.length;

  if (totalSignalPhotos === 0) {
    return null; // No high-signal photos, caller should fall back to heuristic
  }

  const photoGroups = [
    { photos: bestPhotos, weight: 3.0 },
    { photos: favPhotos, weight: 2.0 },
    { photos: highRated, weight: 1.5 },
    { photos: lowRated, weight: -1.0 },
  ];

  // Compute characteristics per-photo then average (preserves variance)
  const chars = computeWeightedCharacteristics(photoGroups);

  if (!chars) {
    return null;
  }

  // Boost energy with embedding diversity signal
  const diversity = computeEmbeddingDiversity(photoGroups);
  chars.energy = Math.max(0, Math.min(1, chars.energy * 0.6 + diversity * 0.4));
  chars.complexity = Math.max(0, Math.min(1, chars.complexity * 0.6 + diversity * 0.4));

  // Score movements
  const scores = scoreMovements(chars);

  // Sort and get top 7
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, affinity]) => ({ name, affinity: Math.round(affinity * 100) / 100 }));

  // Also compute centroid for other consumers
  const centroid = computeWeightedCentroid(photoGroups);

  return {
    movements: sorted,
    characteristics: chars,
    diversity,
    signal: {
      bestPhotos: bestPhotos.length,
      favorites: favPhotos.length,
      highRated: highRated.length,
      lowRated: lowRated.length,
      totalSignal: totalSignalPhotos,
    },
  };
}

module.exports = { classifyMovements };
