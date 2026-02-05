const Database = require('better-sqlite3');
const path = require('path');

/**
 * Genre Taxonomy Service
 * Manages music genre database with historical lineages and sonic signatures
 * Foundation for Influence Genealogy feature (Elite tier)
 */
class GenreTaxonomyService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../starforge_genres.db');
    this.db = null;
    this.init();
  }

  init() {
    this.db = new Database(this.dbPath);

    // Create genres table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        parent_id INTEGER,
        
        -- Temporal data
        era_start INTEGER,
        era_end INTEGER,
        decade TEXT,
        
        -- Sonic signature
        bpm_min INTEGER,
        bpm_max INTEGER,
        energy_min REAL,
        energy_max REAL,
        
        -- Frequency profile (JSON)
        frequency_profile TEXT,
        
        -- Metadata
        description TEXT,
        origin_location TEXT,
        cultural_context TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_id) REFERENCES genres(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_genres_parent ON genres(parent_id);
      CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
      CREATE INDEX IF NOT EXISTS idx_genres_decade ON genres(decade);
    `);

    console.log('Genre taxonomy database initialized');
  }

  /**
   * Get genre by ID or slug
   */
  getGenre(identifier) {
    const isNumeric = !isNaN(identifier);
    
    if (isNumeric) {
      return this.db.prepare('SELECT * FROM genres WHERE id = ?').get(identifier);
    } else {
      return this.db.prepare('SELECT * FROM genres WHERE slug = ?').get(identifier);
    }
  }

  /**
   * Get all child genres (direct descendants)
   */
  getChildren(parentId) {
    return this.db.prepare('SELECT * FROM genres WHERE parent_id = ? ORDER BY era_start').all(parentId);
  }

  /**
   * Get lineage (ancestors) - from genre up to root
   */
  getLineage(genreId) {
    const lineage = [];
    let current = this.getGenre(genreId);
    
    while (current) {
      lineage.unshift(current);
      if (current.parent_id) {
        current = this.getGenre(current.parent_id);
      } else {
        current = null;
      }
    }
    
    return lineage;
  }

  /**
   * Get descendants (children, grandchildren, etc.)
   */
  getDescendants(genreId) {
    const descendants = [];
    const queue = [genreId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = this.getChildren(currentId);
      
      children.forEach(child => {
        descendants.push(child);
        queue.push(child.id);
      });
    }
    
    return descendants;
  }

  /**
   * Get all root genres (no parent)
   */
  getRootGenres() {
    return this.db.prepare('SELECT * FROM genres WHERE parent_id IS NULL ORDER BY name').all();
  }

  /**
   * Search genres by sonic signature
   */
  findBySonicSignature(bpm, energy, frequencyProfile = null) {
    let query = `
      SELECT *,
        ABS(((bpm_min + bpm_max) / 2.0) - ?) as bpm_distance,
        ABS(((energy_min + energy_max) / 2.0) - ?) as energy_distance
      FROM genres
      WHERE ? BETWEEN bpm_min AND bpm_max
        AND ? BETWEEN energy_min AND energy_max
      ORDER BY bpm_distance + energy_distance ASC
      LIMIT 10
    `;
    
    return this.db.prepare(query).all(bpm, energy, bpm, energy);
  }

  /**
   * Get genre tree (full hierarchy)
   */
  getFullTree() {
    const roots = this.getRootGenres();
    
    const buildTree = (genre) => {
      const children = this.getChildren(genre.id);
      return {
        ...genre,
        children: children.map(child => buildTree(child))
      };
    };
    
    return roots.map(root => buildTree(root));
  }

  /**
   * Add a new genre
   */
  addGenre(genreData) {
    const {
      name,
      slug,
      parentId = null,
      eraStart,
      eraEnd,
      decade,
      bpmMin,
      bpmMax,
      energyMin,
      energyMax,
      frequencyProfile = null,
      description = '',
      originLocation = '',
      culturalContext = ''
    } = genreData;

    const result = this.db.prepare(`
      INSERT INTO genres (
        name, slug, parent_id, era_start, era_end, decade,
        bpm_min, bpm_max, energy_min, energy_max,
        frequency_profile, description, origin_location, cultural_context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, slug, parentId, eraStart, eraEnd, decade,
      bpmMin, bpmMax, energyMin, energyMax,
      frequencyProfile ? JSON.stringify(frequencyProfile) : null,
      description, originLocation, culturalContext
    );

    return result.lastInsertRowid;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new GenreTaxonomyService();
