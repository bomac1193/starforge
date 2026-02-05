const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Visual DNA Cache Service
 * Stores expensive visual DNA analysis results to avoid reprocessing
 */
class VisualDnaCacheService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../starforge_visual_dna.db');
    this.db = null;
    this.cacheExpiryDays = 7; // Refresh after 7 days
    this.init();
  }

  init() {
    this.db = new Database(this.dbPath);

    // Create cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS visual_dna_cache (
        user_id INTEGER PRIMARY KEY,
        style_description TEXT NOT NULL,
        color_palette TEXT NOT NULL,
        palette_characteristics TEXT,
        dominant_themes TEXT,
        total_analyzed INTEGER,
        high_rated_count INTEGER,
        confidence REAL,
        photo_count INTEGER,
        photo_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Visual DNA cache initialized');
  }

  /**
   * Generate hash of photo collection to detect changes
   */
  generatePhotoHash(photos) {
    // Create a hash from photo IDs and scores to detect changes
    const hashString = photos
      .map(p => `${p.id}-${p.clarosa_score}`)
      .sort()
      .join('|');

    // Simple hash (could use crypto for production)
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Check if cache exists and is valid
   */
  isCacheValid(userId, currentPhotos) {
    try {
      const cached = this.db.prepare(`
        SELECT * FROM visual_dna_cache WHERE user_id = ?
      `).get(userId);

      if (!cached) {
        return { valid: false, reason: 'no_cache' };
      }

      // Check if photo collection changed
      const currentHash = this.generatePhotoHash(currentPhotos);
      if (cached.photo_hash !== currentHash) {
        return { valid: false, reason: 'photos_changed' };
      }

      // Check if cache is expired (older than X days)
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const maxAge = this.cacheExpiryDays * 24 * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        return { valid: false, reason: 'cache_expired' };
      }

      return { valid: true, cached };
    } catch (error) {
      console.error('Cache validation error:', error);
      return { valid: false, reason: 'error' };
    }
  }

  /**
   * Get cached Visual DNA
   */
  getCached(userId, currentPhotos) {
    const validation = this.isCacheValid(userId, currentPhotos);

    if (!validation.valid) {
      console.log(`Cache invalid: ${validation.reason}`);
      return null;
    }

    const cached = validation.cached;

    // Parse JSON fields
    return {
      styleDescription: cached.style_description,
      colorPalette: JSON.parse(cached.color_palette),
      paletteCharacteristics: cached.palette_characteristics,
      dominantThemes: JSON.parse(cached.dominant_themes),
      totalAnalyzed: cached.total_analyzed,
      highRatedCount: cached.high_rated_count,
      confidence: cached.confidence,
      photoCount: cached.photo_count,
      cached: true,
      cacheAge: Math.round((Date.now() - new Date(cached.updated_at).getTime()) / 1000 / 60), // minutes
    };
  }

  /**
   * Save Visual DNA to cache
   */
  saveCache(userId, visualDna, photos) {
    try {
      const photoHash = this.generatePhotoHash(photos);

      this.db.prepare(`
        INSERT OR REPLACE INTO visual_dna_cache (
          user_id,
          style_description,
          color_palette,
          palette_characteristics,
          dominant_themes,
          total_analyzed,
          high_rated_count,
          confidence,
          photo_count,
          photo_hash,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        userId,
        visualDna.styleDescription,
        JSON.stringify(visualDna.colorPalette || []),
        visualDna.paletteCharacteristics || '',
        JSON.stringify(visualDna.dominantThemes || []),
        visualDna.totalAnalyzed || 0,
        visualDna.highRatedCount || 0,
        visualDna.confidence || 0,
        photos.length,
        photoHash
      );

      console.log(`Visual DNA cached for user ${userId}`);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Invalidate cache (force refresh)
   */
  invalidateCache(userId) {
    try {
      this.db.prepare('DELETE FROM visual_dna_cache WHERE user_id = ?').run(userId);
      console.log(`Cache invalidated for user ${userId}`);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(userId) {
    try {
      const cached = this.db.prepare(`
        SELECT
          created_at,
          updated_at,
          photo_count,
          photo_hash
        FROM visual_dna_cache
        WHERE user_id = ?
      `).get(userId);

      if (!cached) {
        return { exists: false };
      }

      const ageMinutes = Math.round((Date.now() - new Date(cached.updated_at).getTime()) / 1000 / 60);

      return {
        exists: true,
        createdAt: cached.created_at,
        updatedAt: cached.updated_at,
        ageMinutes,
        photoCount: cached.photo_count,
        photoHash: cached.photo_hash
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { exists: false };
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new VisualDnaCacheService();
