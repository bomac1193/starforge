/**
 * Project DNA Scanner Service
 *
 * Reads actual project artifacts (strategy docs, READMEs, package.json)
 * to extract core creative identity. This is the highest-conviction signal
 * in the Taste OS — what someone builds reveals who they truly are.
 *
 * Ported from Folio's projectDNAScanner.ts to Starforge CommonJS.
 */

const { readFile, readdir, stat } = require('fs/promises');
const { join, basename } = require('path');
const Database = require('better-sqlite3');
const path = require('path');
const axios = require('axios');

const HOME = process.env.HOME || '/home/user';

// Primary docs — strategy, manifestos (configured via env or discovered during scan)
// Set PROJECT_DNA_DOCS to a comma-separated list of absolute paths
const PRIMARY_DOCS = process.env.PROJECT_DNA_DOCS
  ? process.env.PROJECT_DNA_DOCS.split(',').map(p => p.trim())
  : [];

// Project directories to scan for README + package.json
// Set PROJECT_DNA_DIRS to a comma-separated list of absolute paths
const PROJECT_DIRS = process.env.PROJECT_DNA_DIRS
  ? process.env.PROJECT_DNA_DIRS.split(',').map(p => p.trim())
  : [];

const MAX_FILE_CHARS = 4000;
const MAX_TOTAL_CONTEXT = 40000;

// --- File reading helpers ---

async function safeReadFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.slice(0, MAX_FILE_CHARS);
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function scanProjectDir(dir) {
  const name = basename(dir);
  const readme = await safeReadFile(join(dir, 'README.md'))
    || await safeReadFile(join(dir, 'readme.md'));

  let deps = null;
  const pkgPath = join(dir, 'package.json');
  if (await fileExists(pkgPath)) {
    try {
      const raw = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      deps = JSON.stringify({
        name: pkg.name,
        description: pkg.description,
        dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
        devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies).slice(0, 20) : [],
      });
    } catch {
      deps = null;
    }
  }

  return { name, readme, deps };
}

// --- DB setup ---

const DB_PATH = path.join(__dirname, '../../starforge_identity.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_dna (
      user_id TEXT PRIMARY KEY,
      dna_json TEXT NOT NULL,
      scanned_at TEXT NOT NULL,
      sources_scanned INTEGER DEFAULT 0
    )
  `);
  return db;
}

// --- Main scanner ---

async function scanProjectDNA() {
  const sourcesScanned = [];
  const contextParts = [];
  let totalChars = 0;

  // 1. Read primary docs
  for (const docPath of PRIMARY_DOCS) {
    const content = await safeReadFile(docPath);
    if (content) {
      const label = docPath.replace(HOME, '~');
      sourcesScanned.push(label);
      const part = `\n--- ${label} ---\n${content}`;
      if (totalChars + part.length < MAX_TOTAL_CONTEXT) {
        contextParts.push(part);
        totalChars += part.length;
      }
    }
  }

  // 2. Scan project directories
  for (const dir of PROJECT_DIRS) {
    if (!(await fileExists(dir))) continue;
    const project = await scanProjectDir(dir);
    sourcesScanned.push(`~/${project.name}/`);

    let part = `\n--- Project: ${project.name} ---`;
    if (project.deps) part += `\nDependencies: ${project.deps}`;
    if (project.readme) part += `\nREADME:\n${project.readme}`;

    if (totalChars + part.length < MAX_TOTAL_CONTEXT) {
      contextParts.push(part);
      totalChars += part.length;
    }
  }

  const projectContext = contextParts.join('\n');

  // 3. Extract identity via Claude
  return extractIdentityFromContext(projectContext, sourcesScanned);
}

// --- DB persistence ---

async function scanAndSave(userId = 'default') {
  const projectDNA = await scanProjectDNA();

  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO project_dna (user_id, dna_json, scanned_at, sources_scanned)
    VALUES (?, ?, ?, ?)
  `).run(
    userId,
    JSON.stringify(projectDNA),
    projectDNA.scannedAt,
    projectDNA.sourcesScanned.length
  );
  db.close();

  return projectDNA;
}

function getProjectDNA(userId = 'default') {
  try {
    const db = getDb();
    const row = db.prepare('SELECT dna_json FROM project_dna WHERE user_id = ?').get(userId);
    db.close();
    if (!row) return null;
    return JSON.parse(row.dna_json);
  } catch {
    return null;
  }
}

// --- Scan from uploaded files (for other users) ---

async function extractIdentityFromContext(projectContext, sourcesScanned) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are analyzing a creator's actual project artifacts to extract their CORE IDENTITY. This is the highest-fidelity taste signal possible — what someone builds reveals who they truly are.

PROJECT ARTIFACTS:
${projectContext}

---

Extract the creator's identity from these artifacts. Be SPECIFIC and CONCRETE — use actual project names, actual tools, actual references found in the documents. Do not generalize.

Return ONLY valid JSON:
{
  "coreIdentity": {
    "thesis": "One sentence: what they are fundamentally building across all projects",
    "domains": ["3-7 specific domains they work in, e.g. 'conviction intelligence for music', not just 'tech'"],
    "tools": ["Actual tools/frameworks found in their projects"],
    "references": ["Actual people, books, traditions they cite — e.g. 'Eglash (African Fractals)', 'Gerdes (Lunda Geometry)'"],
    "antiTaste": ["Things they explicitly reject or position against — extract from strategy docs, naming, architecture decisions"]
  },
  "expansionVectors": {
    "lineage": ["Reference -> where it could lead next. e.g. 'Kentridge (erasure as memory) -> temporal decay visualization'"],
    "gaps": ["What's missing across their ecosystem — things they've planned but not built, or logical next steps"]
  },
  "tone": {
    "register": "One phrase describing their communication register, e.g. 'architectural-academic with cultural grounding'",
    "vocabulary": ["10-15 key terms that define their voice — words they use repeatedly across docs"],
    "preserveTerms": ["Terms that should NEVER be simplified or translated — domain-specific, culturally specific, or coined terms"]
  }
}

RULES:
- Base EVERYTHING on the actual artifacts. Do not invent or assume.
- "antiTaste" = things they explicitly position against (e.g., "post-vanity" means anti-engagement-metrics)
- "preserveTerms" = words like "lusona", "veve", "conviction", "provenance" that carry specific meaning
- "tools" = actual technologies found in package.json or source code (Max/MSP, gen~, TouchDesigner, RAVE, Solidity, etc.)
- "references" = actual people/works cited, not generic influences
- Return ONLY valid JSON, no markdown wrapping`
    }],
  }, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
  });

  const text = response.data.content[0].text;
  const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    ...parsed,
    confidence: 1.0,
    scannedAt: new Date().toISOString(),
    sourcesScanned,
  };
}

/**
 * Scan from uploaded files (for users who upload their project files).
 * @param {Array<{name: string, content: string}>} files - uploaded file contents
 * @param {string} direction - optional user-provided brief about who they are
 */
async function scanFromUploadedFiles(files, direction = '') {
  const contextParts = [];
  const sourcesScanned = [];
  let totalChars = 0;

  if (direction) {
    const part = `\n--- Creator Direction ---\n${direction}`;
    contextParts.push(part);
    totalChars += part.length;
    sourcesScanned.push('direction_prompt');
  }

  for (const file of files) {
    const content = file.content.slice(0, MAX_FILE_CHARS);
    const part = `\n--- ${file.name} ---\n${content}`;
    if (totalChars + part.length < MAX_TOTAL_CONTEXT) {
      contextParts.push(part);
      totalChars += part.length;
      sourcesScanned.push(file.name);
    }
  }

  if (sourcesScanned.length === 0) {
    throw new Error('No readable files provided');
  }

  return extractIdentityFromContext(contextParts.join('\n'), sourcesScanned);
}

/**
 * Scan a user-provided directory for project artifacts.
 * @param {string} basePath - root directory to scan
 * @param {number} maxDepth - how deep to recurse (default 2)
 */
async function scanDirectory(basePath, maxDepth = 2) {
  const contextParts = [];
  const sourcesScanned = [];
  let totalChars = 0;

  async function scanDir(dir, depth) {
    if (depth > maxDepth || totalChars >= MAX_TOTAL_CONTEXT) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    // Scan known files in this directory
    const project = await scanProjectDir(dir);
    if (project.readme || project.deps) {
      const label = dir.replace(HOME, '~');
      sourcesScanned.push(label);
      let part = `\n--- Project: ${project.name} ---`;
      if (project.deps) part += `\nDependencies: ${project.deps}`;
      if (project.readme) part += `\nREADME:\n${project.readme}`;

      if (totalChars + part.length < MAX_TOTAL_CONTEXT) {
        contextParts.push(part);
        totalChars += part.length;
      }
    }

    // Also read .md and strategy docs at this level
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|txt)$/i.test(entry.name) && entry.name.toLowerCase() !== 'readme.md') {
        const content = await safeReadFile(join(dir, entry.name));
        if (content) {
          const label = join(dir, entry.name).replace(HOME, '~');
          sourcesScanned.push(label);
          const part = `\n--- ${label} ---\n${content}`;
          if (totalChars + part.length < MAX_TOTAL_CONTEXT) {
            contextParts.push(part);
            totalChars += part.length;
          }
        }
      }
    }

    // Recurse into subdirectories (skip node_modules, .git, etc.)
    const skipDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', '.venv', 'venv']);
    for (const entry of entries) {
      if (entry.isDirectory() && !skipDirs.has(entry.name) && !entry.name.startsWith('.')) {
        await scanDir(join(dir, entry.name), depth + 1);
      }
    }
  }

  await scanDir(basePath, 0);

  if (sourcesScanned.length === 0) {
    throw new Error('No project artifacts found in directory');
  }

  return extractIdentityFromContext(contextParts.join('\n'), sourcesScanned);
}

/**
 * Scan from uploaded files and save to DB.
 */
async function scanUploadedAndSave(userId, files, direction) {
  const projectDNA = await scanFromUploadedFiles(files, direction);

  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO project_dna (user_id, dna_json, scanned_at, sources_scanned)
    VALUES (?, ?, ?, ?)
  `).run(userId, JSON.stringify(projectDNA), projectDNA.scannedAt, projectDNA.sourcesScanned.length);
  db.close();

  return projectDNA;
}

/**
 * Scan a directory and save to DB.
 */
async function scanDirectoryAndSave(userId, dirPath) {
  const projectDNA = await scanDirectory(dirPath);

  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO project_dna (user_id, dna_json, scanned_at, sources_scanned)
    VALUES (?, ?, ?, ?)
  `).run(userId, JSON.stringify(projectDNA), projectDNA.scannedAt, projectDNA.sourcesScanned.length);
  db.close();

  return projectDNA;
}

module.exports = {
  scanProjectDNA,
  scanAndSave,
  getProjectDNA,
  scanFromUploadedFiles,
  scanDirectory,
  scanUploadedAndSave,
  scanDirectoryAndSave,
};
