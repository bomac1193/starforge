/**
 * Expansion Engine — Lineage Discovery Service
 *
 * Takes Project DNA + Audio DNA + Visual DNA gaps → Claude deep-research prompt
 * → returns structured cultural artifact suggestions to fill lineage gaps.
 *
 * Each suggestion: specific artifact (mixtape, radio show, scene, producer, book)
 * with year, location, medium, connection rationale, and conviction score.
 *
 * The real power comes when layered with Crucibla conviction data later.
 */

const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const projectDnaService = require('./projectDnaService');

// SQLite cache for expansion results
const dbPath = path.join(__dirname, '../../starforge_expansion.db');
let db = null;

function getDB() {
  if (!db) {
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS expansion_results (
        user_id TEXT PRIMARY KEY,
        suggestions_json TEXT NOT NULL,
        project_dna_hash TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS lineage_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        artifact_key TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        notes TEXT DEFAULT '',
        artifact_json TEXT NOT NULL,
        saved_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, artifact_key)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS lineage_summaries (
        user_id TEXT PRIMARY KEY,
        master_lineage TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

/**
 * Build rating feedback context from previous Likert ratings.
 * This is the training signal that makes each discovery run sharper.
 *
 * Ancestors (5) + Canon (4) = "go deeper in this direction"
 * Resonant (3) = "interesting, don't over-index"
 * Noted (2) + Miss (1) = "wrong direction, avoid similar"
 */
function buildRatingFeedback(userId) {
  const saved = getSavedArtifacts(userId);
  if (saved.length === 0) return null;

  const ancestors = saved.filter(s => s.rating === 5);
  const canon = saved.filter(s => s.rating === 4);
  const resonant = saved.filter(s => s.rating === 3);
  const noted = saved.filter(s => s.rating === 2);
  const misses = saved.filter(s => s.rating === 1);

  const parts = [];
  parts.push(`=== PREVIOUS DISCOVERY FEEDBACK (${saved.length} artifacts rated) ===`);
  parts.push(`System accuracy so far: ${Math.round(((ancestors.length + canon.length + resonant.length) / saved.length) * 100)}% resonance rate`);

  if (ancestors.length > 0) {
    parts.push(`\nANCESTORS (rated 5/5 — these are core to my lineage, go DEEPER in these directions):`);
    ancestors.forEach(a => {
      parts.push(`  - "${a.artifact}" (${a.year || '?'}, ${a.location || '?'}, ${a.medium || '?'})`);
      if (a.gap_filled) parts.push(`    Gap filled: ${a.gap_filled}`);
    });
  }

  if (canon.length > 0) {
    parts.push(`\nCANON (rated 4/5 — strong connections, find more like these):`);
    canon.forEach(a => {
      parts.push(`  - "${a.artifact}" (${a.year || '?'}, ${a.location || '?'}, ${a.medium || '?'})`);
      if (a.gap_filled) parts.push(`    Gap filled: ${a.gap_filled}`);
    });
  }

  if (resonant.length > 0) {
    parts.push(`\nRESONANT (rated 3/5 — interesting parallels, don't over-index):`);
    resonant.forEach(a => {
      parts.push(`  - "${a.artifact}" (${a.year || '?'}, ${a.medium || '?'})`);
    });
  }

  if (noted.length > 0) {
    parts.push(`\nNOTED (rated 2/5 — acknowledged but weak connection):`);
    noted.forEach(a => {
      parts.push(`  - "${a.artifact}" (${a.medium || '?'})`);
    });
  }

  if (misses.length > 0) {
    parts.push(`\nMISSES (rated 1/5 — wrong direction, AVOID similar artifacts):`);
    misses.forEach(a => {
      parts.push(`  - "${a.artifact}" (${a.medium || '?'})`);
    });
  }

  // Extract directional signals
  const ancestorRegions = [...new Set(ancestors.map(a => a.location).filter(Boolean))];
  const ancestorMediums = [...new Set(ancestors.map(a => a.medium).filter(Boolean))];
  const ancestorGaps = [...new Set(ancestors.map(a => a.gap_filled).filter(Boolean))];
  const missRegions = [...new Set(misses.map(a => a.location).filter(Boolean))];
  const missMediums = [...new Set(misses.map(a => a.medium).filter(Boolean))];

  if (ancestorRegions.length > 0 || ancestorGaps.length > 0) {
    parts.push(`\nDIRECTIONAL SIGNALS:`);
    if (ancestorRegions.length > 0) parts.push(`  Regions that resonate: ${ancestorRegions.join(', ')}`);
    if (ancestorMediums.length > 0) parts.push(`  Mediums that resonate: ${ancestorMediums.join(', ')}`);
    if (ancestorGaps.length > 0) parts.push(`  Lineage threads confirmed: ${ancestorGaps.join(', ')}`);
    if (missRegions.length > 0) parts.push(`  Regions that missed: ${missRegions.join(', ')}`);
    if (missMediums.length > 0) parts.push(`  Mediums that missed: ${missMediums.join(', ')}`);
  }

  return {
    text: parts.join('\n'),
    stats: {
      total: saved.length,
      ancestors: ancestors.length,
      canon: canon.length,
      resonant: resonant.length,
      noted: noted.length,
      misses: misses.length,
      resonanceRate: Math.round(((ancestors.length + canon.length + resonant.length) / saved.length) * 100),
    },
    // Collect all previously suggested artifact names to avoid repeats
    previousArtifacts: saved.map(a => a.artifact).filter(Boolean),
  };
}

/**
 * Run a lineage discovery session
 * Calls Claude with deep-research prompt based on user's identity signals.
 * If previous ratings exist, injects them as feedback to sharpen results.
 */
async function discoverLineage(userId = 'default', options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  // Gather all identity signals
  const projectDna = projectDnaService.getProjectDNA(userId);
  if (!projectDna) {
    throw new Error('No Project DNA found. Run a Project DNA scan first.');
  }

  // Build the context from all available signals
  const identityContext = buildIdentityContext(projectDna, options);

  // Build feedback from previous ratings
  const feedback = buildRatingFeedback(userId);
  const hasFeedback = feedback && feedback.stats.total > 0;
  const previousArtifacts = feedback?.previousArtifacts || [];

  // Build the prompt — adapts based on whether we have prior feedback
  let feedbackBlock = '';
  if (hasFeedback) {
    feedbackBlock = `

${feedback.text}

IMPORTANT FEEDBACK INSTRUCTIONS:
- Do NOT repeat any previously suggested artifacts. All suggestions must be NEW.
- Previously suggested: ${previousArtifacts.map(a => `"${a}"`).join(', ')}
- For artifacts rated ANCESTOR (5) or CANON (4): find deeper, more specific artifacts in the same lineage threads. Go further into those traditions, time periods, and regions.
- For artifacts rated MISS (1): avoid similar regions, mediums, and themes unless you have a genuinely different angle.
- For artifacts rated NOTED (2): the connection was too weak. If you suggest from similar territory, the connection must be much more specific.
- Your conviction scores should be HIGHER on average this round — you now know what resonates.
- Find at least 2-3 artifacts that go deeper into confirmed lineage threads (ancestors/canon).
- Find at least 2-3 artifacts from entirely new branches not yet explored.`;
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a cultural lineage researcher. Your job is to find SPECIFIC cultural artifacts — mixtapes, radio shows, scenes, producers, albums, books, movements, collectives — that fill gaps in a creator's lineage.

You are NOT an algorithm recommending "similar" content. You are completing a genealogy. You are finding the ancestors and cousins that this creator doesn't know they have.

CREATOR'S IDENTITY:
${identityContext}
${feedbackBlock}

---

Find 8-12 specific cultural artifacts that would expand this creator's lineage. For each one:
1. It must be REAL (actual artists, actual releases, actual scenes, actual events)
2. It must connect to something SPECIFIC in the creator's existing work
3. It should come from outside their known sphere — the point is to expand, not reinforce
4. Prioritize non-Western, underground, and historically marginalized traditions where the connection is genuine
5. Include at least 2-3 from Africa, 2-3 from Asia/Middle East, and 2-3 from Latin America/Caribbean IF there are genuine lineage connections
6. Do NOT stretch — only include artifacts with real conceptual or technical connections${hasFeedback ? '\n7. Do NOT repeat any previously suggested artifacts — every suggestion must be new' : ''}

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "artifact": "Full name of the artifact — artist, title, collective, or event",
      "year": 2014,
      "location": "City, Country",
      "medium": "mixtape|album|radio show|book|collective|festival|scene|installation|technique|tradition",
      "connection": "One sentence explaining the SPECIFIC connection to the creator's work. Reference actual projects, tools, or concepts from their identity.",
      "gap_filled": "What lineage gap this fills — e.g. 'West African electronic synthesis lineage' or 'fractal geometry in sound design'",
      "conviction": 0.85,
      "deep_context": "2-3 sentences of deeper context — why this matters, what makes it significant, what the creator would gain from engaging with it"
    }
  ],
  "lineage_map": {
    "primary_thread": "The main lineage thread connecting all suggestions",
    "branches": ["2-3 secondary lineage threads identified"],
    "missing_regions": ["Geographic or cultural regions where lineage connections likely exist but couldn't be confidently identified"]
  }${hasFeedback ? `,
  "feedback_response": {
    "threads_deepened": ["Which ancestor/canon lineage threads you went deeper on"],
    "new_branches": ["New unexplored branches introduced this round"],
    "avoided": ["What you deliberately avoided based on misses"]
  }` : ''}
}

RULES:
- Every artifact must be REAL and verifiable
- Conviction score: 0.9+ = direct technical/conceptual connection, 0.7-0.9 = strong thematic connection, 0.5-0.7 = interesting parallel
- Do NOT include well-known Western canon unless the connection is genuinely non-obvious
- The creator already knows their own references — find the ones they DON'T know`
    }],
    system: 'You are a cultural lineage researcher with deep knowledge of global music, art, technology, and cultural movements. You specialize in finding non-obvious connections between contemporary digital creators and historical/global cultural traditions. You never fabricate — every artifact you cite must be real.',
  }, {
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    timeout: 120000,
  });

  const content = response.data.content[0].text;

  // Parse JSON from response
  let result;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    result = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('Failed to parse expansion response:', parseErr.message);
    throw new Error('Failed to parse lineage discovery results');
  }

  // Count discovery rounds
  const database = getDB();
  const existingRow = database.prepare('SELECT suggestions_json FROM expansion_results WHERE user_id = ?').get(userId);
  const previousRound = existingRow ? (JSON.parse(existingRow.suggestions_json)?.metadata?.discoveryRound || 0) : 0;

  // Add metadata
  result.metadata = {
    userId,
    discoveredAt: new Date().toISOString(),
    discoveryRound: previousRound + 1,
    feedbackUsed: hasFeedback,
    feedbackStats: feedback?.stats || null,
    sourcesUsed: {
      projectDna: !!projectDna,
      audioDna: !!options.audioDna,
      visualDna: !!options.visualDna,
    },
    totalSuggestions: result.suggestions?.length || 0,
  };

  // Cache results
  const dnaHash = JSON.stringify(projectDna?.coreIdentity?.thesis || '').slice(0, 50);

  database.prepare(`
    INSERT OR REPLACE INTO expansion_results (user_id, suggestions_json, project_dna_hash, updated_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(userId, JSON.stringify(result), dnaHash);

  return result;
}

/**
 * Build identity context string from all available signals
 */
function buildIdentityContext(projectDna, options = {}) {
  const parts = [];

  // Project DNA (highest signal)
  if (projectDna) {
    const ci = projectDna.coreIdentity || {};
    const ev = projectDna.expansionVectors || {};
    const tn = projectDna.tone || {};

    parts.push('=== PROJECT DNA (from actual project artifacts) ===');
    if (ci.thesis) parts.push(`Thesis: ${ci.thesis}`);
    if (ci.domains?.length) parts.push(`Domains: ${ci.domains.join(', ')}`);
    if (ci.tools?.length) parts.push(`Tools: ${ci.tools.join(', ')}`);
    if (ci.references?.length) parts.push(`Known references: ${ci.references.join(', ')}`);
    if (ci.antiTaste?.length) parts.push(`Anti-taste (rejects): ${ci.antiTaste.join(', ')}`);

    if (ev.lineage?.length) {
      parts.push(`\nExisting lineage threads:`);
      ev.lineage.forEach(l => parts.push(`  - ${l}`));
    }
    if (ev.gaps?.length) {
      parts.push(`\nIdentified gaps (things planned but not built):`);
      ev.gaps.forEach(g => parts.push(`  - ${g}`));
    }

    if (tn.register) parts.push(`\nVoice register: ${tn.register}`);
    if (tn.vocabulary?.length) parts.push(`Key vocabulary: ${tn.vocabulary.join(', ')}`);
  }

  // Audio DNA
  if (options.audioDna) {
    parts.push('\n=== AUDIO DNA ===');
    if (options.audioDna.primary_genre) parts.push(`Primary genre: ${options.audioDna.primary_genre}`);
    if (options.audioDna.taste_coherence) parts.push(`Taste coherence: ${options.audioDna.taste_coherence}`);
  }

  // Visual DNA
  if (options.visualDna) {
    parts.push('\n=== VISUAL DNA ===');
    if (options.visualDna.art_movements?.length) {
      parts.push(`Art movements: ${options.visualDna.art_movements.map(m => `${m.name} (${m.affinity})`).join(', ')}`);
    }
    if (options.visualDna.influences?.length) {
      parts.push(`Visual influences: ${options.visualDna.influences.join(', ')}`);
    }
  }

  return parts.join('\n');
}

/**
 * Get cached expansion suggestions for a user
 */
function getSuggestions(userId = 'default') {
  try {
    const database = getDB();
    const row = database.prepare('SELECT * FROM expansion_results WHERE user_id = ?').get(userId);
    if (!row) return null;
    return JSON.parse(row.suggestions_json);
  } catch {
    return null;
  }
}

/**
 * Rate a lineage discovery artifact (1-5 Likert)
 * 1=miss, 2=noted, 3=resonant, 4=canon, 5=ancestor
 */
function rateArtifact(userId, artifact, rating, notes = '') {
  const database = getDB();
  const artifactKey = `${artifact.artifact}::${artifact.year || ''}`.toLowerCase().trim();

  database.prepare(`
    INSERT INTO lineage_ratings (user_id, artifact_key, rating, notes, artifact_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, artifact_key)
    DO UPDATE SET rating = excluded.rating, notes = excluded.notes, saved_at = datetime('now')
  `).run(userId, artifactKey, rating, notes, JSON.stringify(artifact));

  return { success: true, artifactKey, rating };
}

/**
 * Get all saved/rated artifacts for a user
 */
function getSavedArtifacts(userId = 'default') {
  try {
    const database = getDB();
    const rows = database.prepare(
      'SELECT * FROM lineage_ratings WHERE user_id = ? ORDER BY rating DESC, saved_at DESC'
    ).all(userId);

    return rows.map(row => ({
      ...JSON.parse(row.artifact_json),
      rating: row.rating,
      notes: row.notes,
      savedAt: row.saved_at,
      artifactKey: row.artifact_key,
    }));
  } catch {
    return [];
  }
}

/**
 * Remove a rating
 */
function removeRating(userId, artifactKey) {
  const database = getDB();
  database.prepare('DELETE FROM lineage_ratings WHERE user_id = ? AND artifact_key = ?').run(userId, artifactKey);
  return { success: true };
}

/**
 * Build a structured lineage summary from rated artifacts + discovery state.
 * Used by Twin OS context endpoint to expose lineage to Nommo.
 */
function getLineageSummary(userId = 'default') {
  const saved = getSavedArtifacts(userId);
  const suggestions = getSuggestions(userId);
  if (!saved.length && !suggestions) return null;

  const ancestors = saved.filter(a => a.rating === 5);
  const canon = saved.filter(a => a.rating === 4);
  const resonant = saved.filter(a => a.rating === 3);
  const misses = saved.filter(a => a.rating === 1);

  const threads = new Set();
  for (const a of [...ancestors, ...canon]) {
    if (a.gap_filled) threads.add(a.gap_filled);
  }

  // Get persisted master lineage text (pushed from Qualn)
  let masterLineage = null;
  try {
    const database = getDB();
    const row = database.prepare('SELECT master_lineage FROM lineage_summaries WHERE user_id = ?').get(userId);
    if (row) masterLineage = row.master_lineage;
  } catch { /* no summary yet */ }

  return {
    ancestors: ancestors.map(a => ({ artifact: a.artifact, year: a.year, location: a.location, gap_filled: a.gap_filled })),
    canon: canon.map(a => ({ artifact: a.artifact, year: a.year, location: a.location, gap_filled: a.gap_filled })),
    resonant_count: resonant.length,
    miss_count: misses.length,
    total_rated: saved.length,
    resonance_rate: saved.length > 0 ? Math.round(saved.filter(a => a.rating >= 3).length / saved.length * 100) : 0,
    lineage_threads: [...threads],
    primary_thread: suggestions?.lineage_map?.primary_thread || null,
    branches: suggestions?.lineage_map?.branches || [],
    missing_regions: suggestions?.lineage_map?.missing_regions || [],
    discovery_round: suggestions?.metadata?.discoveryRound || 0,
    master_lineage: masterLineage,
  };
}

/**
 * Store master lineage synthesis text (pushed from Qualn after GPT synthesis)
 */
function setLineageSummary(userId = 'default', text) {
  const database = getDB();
  database.prepare(`
    INSERT INTO lineage_summaries (user_id, master_lineage, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET master_lineage = excluded.master_lineage, updated_at = datetime('now')
  `).run(userId, text);
}

module.exports = { discoverLineage, getSuggestions, rateArtifact, getSavedArtifacts, removeRating, getLineageSummary, setLineageSummary };
