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
  }
  return db;
}

/**
 * Run a lineage discovery session
 * Calls Claude with deep-research prompt based on user's identity signals
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

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a cultural lineage researcher. Your job is to find SPECIFIC cultural artifacts — mixtapes, radio shows, scenes, producers, albums, books, movements, collectives — that fill gaps in a creator's lineage.

You are NOT an algorithm recommending "similar" content. You are completing a genealogy. You are finding the ancestors and cousins that this creator doesn't know they have.

CREATOR'S IDENTITY:
${identityContext}

---

Find 8-12 specific cultural artifacts that would expand this creator's lineage. For each one:
1. It must be REAL (actual artists, actual releases, actual scenes, actual events)
2. It must connect to something SPECIFIC in the creator's existing work
3. It should come from outside their known sphere — the point is to expand, not reinforce
4. Prioritize non-Western, underground, and historically marginalized traditions where the connection is genuine
5. Include at least 2-3 from Africa, 2-3 from Asia/Middle East, and 2-3 from Latin America/Caribbean IF there are genuine lineage connections
6. Do NOT stretch — only include artifacts with real conceptual or technical connections

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
  }
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

  // Add metadata
  result.metadata = {
    userId,
    discoveredAt: new Date().toISOString(),
    sourcesUsed: {
      projectDna: !!projectDna,
      audioDna: !!options.audioDna,
      visualDna: !!options.visualDna,
    },
    totalSuggestions: result.suggestions?.length || 0,
  };

  // Cache results
  const database = getDB();
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

module.exports = { discoverLineage, getSuggestions, rateArtifact, getSavedArtifacts, removeRating };
