/**
 * Relational Intelligence Service
 *
 * Duo/team profiling using archetype relational dynamics.
 * Turns Ori from a personal tool into a B2B platform.
 *
 * Each archetype has:
 * - collaboratesWith: who they work best with (+20 affinity)
 * - tensionWith: creative friction that sharpens both (+10)
 * - avoidWith: friction risk (-15)
 * - growthToward: growth catalyst (+15)
 */

const subtasteService = require('./subtasteService');

// Relational weight constants
const COLLABORATE_SCORE = 20;
const TENSION_SCORE = 10; // Positive — creative tension is valuable
const AVOID_SCORE = -15;
const GROWTH_SCORE = 15;

/**
 * Work modes — the lens the collaboration is viewed through.
 * Each mode favours archetypes whose creative mode suits the task at hand
 * and penalises archetypes whose mode slows it down.
 *
 * Scores layer on top of static archetype dynamics, so a pair that looks
 * neutral in one mode can become strong in another.
 */
const WORK_MODES = {
  open: {
    label: 'Open Exploration',
    description: 'No fixed agenda. Base archetype dynamics only.',
    favors: [],
    penalizes: [],
    note: null,
  },
  ship: {
    label: 'Ship & Execute',
    description: 'Deadlines, deliverables, manifestation. What gets made matters.',
    favors: ['F-9', 'T-1', 'C-4'],
    penalizes: ['V-2', 'D-8'],
    note: 'Fabrication, architecture and editorial cuts carry execution modes. Pure prophecy and intuition slow delivery.',
  },
  explore: {
    label: 'Research & Discover',
    description: 'Sensing, scouting, deep listening before any commitment.',
    favors: ['V-2', 'D-8', 'L-3', 'P-7'],
    penalizes: ['C-4', 'F-9'],
    note: 'Prophetic and sedimentary modes thrive. Cutting and shipping close the aperture too early.',
  },
  launch: {
    label: 'Launch & Amplify',
    description: 'Public release, distribution, reach, narrative.',
    favors: ['H-6', 'N-5', 'F-9'],
    penalizes: ['P-7', 'Ø'],
    note: 'Broadcast and bridging carry reach. Archival and receptive modes slow the signal.',
  },
  refine: {
    label: 'Refine & Edit',
    description: 'Polish, editorial pass, tightening the work.',
    favors: ['C-4', 'T-1', 'S-0'],
    penalizes: ['H-6', 'R-10'],
    note: 'Editorial, architectural and standard-holding modes refine. Broadcast and rupture make noise.',
  },
  rupture: {
    label: 'Break & Reimagine',
    description: 'Scrap the plan, fracture conventions, start again.',
    favors: ['R-10', 'D-8', 'V-2'],
    penalizes: ['L-3', 'T-1'],
    note: 'Rupture and channelling open new ground. Patience and architecture protect the old form.',
  },
  critique: {
    label: 'Critique & Pressure-Test',
    description: 'Find the weakness. Break the idea before the world does.',
    favors: ['C-4', 'R-10', 'T-1'],
    penalizes: ['H-6', 'Ø'],
    note: 'Editorial, contrarian and systemic modes sharpen each other. Enthusiasm and receptivity soften the test.',
  },
};

const MODE_FAVOR_BONUS = 12; // Applied per side when archetype fits the mode
const MODE_PENALTY = -8;     // Applied per side when archetype fights the mode

class RelationalIntelligenceService {

  /**
   * Analyze a duo (two creators) for creative chemistry.
   * @param {object} profile1 - { archetypePrimary, archetypeSecondary, distribution, audio, visual }
   * @param {object} profile2 - Same shape
   * @param {object} [options] - { mode: 'open'|'ship'|'explore'|'launch'|'refine'|'rupture'|'critique' }
   * @returns Complementarity analysis
   */
  analyzeDuo(profile1, profile2, options = {}) {
    if (!profile1?.archetypePrimary || !profile2?.archetypePrimary) {
      return { success: false, error: 'Both profiles need archetype classification' };
    }

    const arch1 = subtasteService.getArchetype(profile1.archetypePrimary);
    const arch2 = subtasteService.getArchetype(profile2.archetypePrimary);

    if (!arch1 || !arch2) {
      return { success: false, error: 'Unknown archetype designation' };
    }

    const modeKey = options.mode && WORK_MODES[options.mode] ? options.mode : 'open';
    const mode = WORK_MODES[modeKey];

    // Calculate relational score from archetype dynamics
    const relationalScore = this._calculateRelationalScore(
      profile1.archetypePrimary, profile2.archetypePrimary, arch1, arch2
    );

    // Mode-specific adjustment — does this pair fit the task at hand?
    const modeAdjustment = this._calculateModeAdjustment(
      profile1.archetypePrimary, profile2.archetypePrimary, modeKey
    );

    // Distribution overlap — how similar their archetype distributions are
    const distributionOverlap = this._calculateDistributionOverlap(
      profile1.distribution || {}, profile2.distribution || {}
    );

    // Combined complementarity — calibrated so the theoretical maximum
    // actually reaches 100, not ~85.
    //
    //   Static dynamics (max +40 — mutual collaborate)
    //   Mode adjustment (max +24 — both favoured)
    //   combinedScore max = 64, min = -46
    //
    //   Static + mode contribution ..... up to 60 pts (0.9375 × 64)
    //   Distribution similarity ........ up to 25 pts (1.0 × 25)
    //   Baseline ....................... 15 pts
    //                                    ───────────
    //                                    100 pts
    //
    // 0.9375 = 60 / 64 so that a pair of mutual collaborators whose mode
    // fully fits the task and whose distributions perfectly overlap hits
    // exactly 100. Lower-impact pairs decay smoothly from there.
    const combinedScore = relationalScore.score + modeAdjustment.score;
    const complementarity = Math.max(0, Math.min(100,
      combinedScore * 0.9375 + distributionOverlap.similarity * 25 + 15
    ));

    // Predict collaboration type
    const collaborationType = this._predictCollaborationType(
      arch1, arch2, relationalScore, mode, modeAdjustment
    );

    return {
      success: true,
      complementarity: Math.round(complementarity),
      relational: relationalScore,
      mode: {
        key: modeKey,
        label: mode.label,
        description: mode.description,
        note: mode.note,
        adjustment: modeAdjustment,
      },
      distributionOverlap,
      collaborationType,
      profile1Summary: {
        designation: profile1.archetypePrimary,
        glyph: arch1.glyph,
        creativeMode: arch1.creativeMode,
      },
      profile2Summary: {
        designation: profile2.archetypePrimary,
        glyph: arch2.glyph,
        creativeMode: arch2.creativeMode,
      },
    };
  }

  /**
   * Return all supported work modes as an array (for frontend menus).
   */
  listModes() {
    return Object.entries(WORK_MODES).map(([key, m]) => ({
      key,
      label: m.label,
      description: m.description,
    }));
  }

  /**
   * Analyze a team of creators.
   * @param {object[]} profiles - Array of profile objects
   * @param {object} [options] - { mode }
   */
  analyzeTeam(profiles, options = {}) {
    if (!profiles || profiles.length < 2) {
      return { success: false, error: 'Need at least 2 profiles' };
    }

    // Pairwise analysis
    const pairwise = [];
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        pairwise.push({
          pair: [i, j],
          analysis: this.analyzeDuo(profiles[i], profiles[j], options),
        });
      }
    }

    // Average complementarity
    const validPairs = pairwise.filter(p => p.analysis.success);
    const avgComplementarity = validPairs.length > 0
      ? Math.round(validPairs.reduce((s, p) => s + p.analysis.complementarity, 0) / validPairs.length)
      : 0;

    // Archetype coverage
    const designations = profiles.map(p => p.archetypePrimary).filter(Boolean);
    const uniqueArchetypes = [...new Set(designations)];

    // Identify roster gaps
    const allDesignations = subtasteService.ALL_DESIGNATIONS;
    const missingArchetypes = allDesignations
      .filter(d => !designations.includes(d))
      .map(d => {
        const arch = subtasteService.getArchetype(d);
        return arch ? { designation: d, glyph: arch.glyph, creativeMode: arch.creativeMode } : null;
      })
      .filter(Boolean);

    // Find strongest and weakest pairs
    const strongest = validPairs.length > 0
      ? validPairs.reduce((a, b) => a.analysis.complementarity > b.analysis.complementarity ? a : b)
      : null;
    const weakest = validPairs.length > 0
      ? validPairs.reduce((a, b) => a.analysis.complementarity < b.analysis.complementarity ? a : b)
      : null;

    return {
      success: true,
      teamSize: profiles.length,
      avgComplementarity,
      archetypeCoverage: {
        unique: uniqueArchetypes.length,
        total: allDesignations.length,
        coveragePercent: Math.round((uniqueArchetypes.length / allDesignations.length) * 100),
      },
      missingArchetypes: missingArchetypes.slice(0, 5),
      strongestPair: strongest ? {
        pair: strongest.pair,
        complementarity: strongest.analysis.complementarity,
      } : null,
      weakestPair: weakest ? {
        pair: weakest.pair,
        complementarity: weakest.analysis.complementarity,
      } : null,
      pairwise: validPairs.map(p => ({
        pair: p.pair,
        complementarity: p.analysis.complementarity,
        collaborationType: p.analysis.collaborationType,
      })),
    };
  }

  // ── Private Methods ──

  _calculateRelationalScore(d1, d2, arch1, arch2) {
    let score = 0;
    const dynamics = [];

    // Check 1→2 relationships
    if (arch1.collaboratesWith?.includes(d2)) {
      score += COLLABORATE_SCORE;
      dynamics.push({ type: 'collaborate', from: d1, to: d2, score: COLLABORATE_SCORE });
    }
    if (arch1.tensionWith?.includes(d2)) {
      score += TENSION_SCORE;
      dynamics.push({ type: 'tension', from: d1, to: d2, score: TENSION_SCORE });
    }
    if (arch1.avoidWith?.includes(d2)) {
      score += AVOID_SCORE;
      dynamics.push({ type: 'avoid', from: d1, to: d2, score: AVOID_SCORE });
    }
    if (arch1.growthToward === d2) {
      score += GROWTH_SCORE;
      dynamics.push({ type: 'growth', from: d1, to: d2, score: GROWTH_SCORE });
    }

    // Check 2→1 relationships
    if (arch2.collaboratesWith?.includes(d1)) {
      score += COLLABORATE_SCORE;
      dynamics.push({ type: 'collaborate', from: d2, to: d1, score: COLLABORATE_SCORE });
    }
    if (arch2.tensionWith?.includes(d1)) {
      score += TENSION_SCORE;
      dynamics.push({ type: 'tension', from: d2, to: d1, score: TENSION_SCORE });
    }
    if (arch2.avoidWith?.includes(d1)) {
      score += AVOID_SCORE;
      dynamics.push({ type: 'avoid', from: d2, to: d1, score: AVOID_SCORE });
    }
    if (arch2.growthToward === d1) {
      score += GROWTH_SCORE;
      dynamics.push({ type: 'growth', from: d2, to: d1, score: GROWTH_SCORE });
    }

    return { score, dynamics };
  }

  _calculateModeAdjustment(d1, d2, modeKey) {
    const mode = WORK_MODES[modeKey] || WORK_MODES.open;
    let score = 0;
    const adjustments = [];

    if (mode.favors.includes(d1)) {
      score += MODE_FAVOR_BONUS;
      adjustments.push({ type: 'mode_fit', designation: d1, score: MODE_FAVOR_BONUS });
    }
    if (mode.favors.includes(d2)) {
      score += MODE_FAVOR_BONUS;
      adjustments.push({ type: 'mode_fit', designation: d2, score: MODE_FAVOR_BONUS });
    }
    if (mode.penalizes.includes(d1)) {
      score += MODE_PENALTY;
      adjustments.push({ type: 'mode_drag', designation: d1, score: MODE_PENALTY });
    }
    if (mode.penalizes.includes(d2)) {
      score += MODE_PENALTY;
      adjustments.push({ type: 'mode_drag', designation: d2, score: MODE_PENALTY });
    }

    return { score, adjustments };
  }

  _calculateDistributionOverlap(dist1, dist2) {
    const allKeys = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const key of allKeys) {
      const v1 = dist1[key] || 0;
      const v2 = dist2[key] || 0;
      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    const similarity = magnitude > 0 ? dotProduct / magnitude : 0;

    return {
      similarity: Math.round(similarity * 100) / 100,
      interpretation: similarity > 0.8 ? 'Very similar taste profiles'
        : similarity > 0.6 ? 'Overlapping with distinct differences'
        : similarity > 0.4 ? 'Moderate overlap'
        : 'Distinct taste profiles',
    };
  }

  _predictCollaborationType(arch1, arch2, relational, mode, modeAdjustment) {
    const hasCollaborate = relational.dynamics.some(d => d.type === 'collaborate');
    const hasTension = relational.dynamics.some(d => d.type === 'tension');
    const hasGrowth = relational.dynamics.some(d => d.type === 'growth');
    const hasAvoid = relational.dynamics.some(d => d.type === 'avoid');

    const modeFit = modeAdjustment?.score || 0;
    const modeLabel = mode?.label || 'Open Exploration';
    const modeNote = mode?.note;

    // Mode-specific tail: what this mode does to the pair
    let modeTail = '';
    if (mode?.key !== 'open' && modeAdjustment?.adjustments?.length > 0) {
      if (modeFit >= 12) {
        modeTail = ` In ${modeLabel} mode, both play to their strengths.`;
      } else if (modeFit > 0) {
        modeTail = ` In ${modeLabel} mode, one of them carries the work.`;
      } else if (modeFit === 0) {
        modeTail = ` ${modeLabel} mode is neutral for this pair.`;
      } else if (modeFit >= -8) {
        modeTail = ` In ${modeLabel} mode, one of them is pulled out of shape.`;
      } else {
        modeTail = ` ${modeLabel} mode fights both of them. Choose a different mode or a different pair.`;
      }
    }

    let base;
    if (hasCollaborate && !hasAvoid) {
      base = {
        type: 'natural_allies',
        description: `${arch1.glyph} and ${arch2.glyph} are natural collaborators. Their creative modes complement each other.`,
      };
    } else if (hasTension && hasGrowth) {
      base = {
        type: 'growth_catalyst',
        description: `${arch1.glyph} and ${arch2.glyph} push each other to grow. The tension between them produces something neither could make alone.`,
      };
    } else if (hasTension && !hasAvoid) {
      base = {
        type: 'creative_friction',
        description: `${arch1.glyph} and ${arch2.glyph} create productive friction. Their disagreements sharpen the work.`,
      };
    } else if (hasAvoid && !hasCollaborate) {
      base = {
        type: 'challenging',
        description: `${arch1.glyph} and ${arch2.glyph} may clash on fundamentals. Success requires explicit negotiation of creative direction.`,
      };
    } else {
      base = {
        type: 'neutral',
        description: `${arch1.glyph} and ${arch2.glyph} have a quiet default dynamic. The work they make together depends on the mode they choose.`,
      };
    }

    return {
      ...base,
      description: base.description + modeTail,
      modeNote: modeNote || null,
    };
  }
}

module.exports = new RelationalIntelligenceService();
