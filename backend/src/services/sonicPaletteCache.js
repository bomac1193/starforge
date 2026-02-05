const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Sonic Palette Cache Service
 * Stores expensive sonic DNA analysis results to avoid reprocessing
 * Mirror architecture of visualDnaCache.js
 */
class SonicPaletteCacheService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../starforge_sonic_palette.db');
    this.db = null;
    this.cacheExpiryDays = 7; // Refresh after 7 days
    this.init();
  }

  init() {
    this.db = new Database(this.dbPath);

    // Create cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sonic_palette_cache (
        user_id INTEGER PRIMARY KEY,
        sonic_palette TEXT NOT NULL,
        tonal_characteristics TEXT,
        dominant_frequencies TEXT,
        total_analyzed INTEGER,
        high_quality_count INTEGER,
        confidence REAL,
        track_count INTEGER,
        track_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Sonic palette cache initialized');
  }

  /**
   * Generate hash of track collection to detect changes
   */
  generateTrackHash(tracks) {
    // Create a hash from track IDs and quality scores to detect changes
    const hashString = tracks
      .map(t => `${t.id || t.filename}-${t.qualityScore || 0}`)
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
  isCacheValid(userId, currentTracks) {
    try {
      const cached = this.db.prepare(`
        SELECT * FROM sonic_palette_cache WHERE user_id = ?
      `).get(userId);

      if (!cached) {
        return { valid: false, reason: 'no_cache' };
      }

      // Check if track collection changed
      const currentHash = this.generateTrackHash(currentTracks);
      if (cached.track_hash !== currentHash) {
        return { valid: false, reason: 'tracks_changed' };
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
   * Get cached Sonic Palette
   */
  getCached(userId, currentTracks) {
    const validation = this.isCacheValid(userId, currentTracks);

    if (!validation.valid) {
      console.log(`Sonic cache invalid: ${validation.reason}`);
      return null;
    }

    const cached = validation.cached;

    // Parse JSON fields
    return {
      sonicPalette: JSON.parse(cached.sonic_palette),
      tonalCharacteristics: cached.tonal_characteristics,
      dominantFrequencies: JSON.parse(cached.dominant_frequencies || '[]'),
      totalAnalyzed: cached.total_analyzed,
      highQualityCount: cached.high_quality_count,
      confidence: cached.confidence,
      trackCount: cached.track_count,
      cached: true,
      cacheAge: Math.round((Date.now() - new Date(cached.updated_at).getTime()) / 1000 / 60), // minutes
    };
  }

  /**
   * Save Sonic Palette to cache
   */
  saveCache(userId, sonicData, tracks) {
    try {
      const trackHash = this.generateTrackHash(tracks);

      this.db.prepare(`
        INSERT OR REPLACE INTO sonic_palette_cache (
          user_id,
          sonic_palette,
          tonal_characteristics,
          dominant_frequencies,
          total_analyzed,
          high_quality_count,
          confidence,
          track_count,
          track_hash,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        userId,
        JSON.stringify(sonicData.sonicPalette || []),
        sonicData.tonalCharacteristics || '',
        JSON.stringify(sonicData.dominantFrequencies || []),
        sonicData.totalAnalyzed || 0,
        sonicData.highQualityCount || 0,
        sonicData.confidence || 0,
        tracks.length,
        trackHash
      );

      console.log(`Sonic palette cached for user ${userId}`);
    } catch (error) {
      console.error('Failed to save sonic cache:', error);
    }
  }

  /**
   * Invalidate cache (force refresh)
   */
  invalidateCache(userId) {
    try {
      this.db.prepare('DELETE FROM sonic_palette_cache WHERE user_id = ?').run(userId);
      console.log(`Sonic cache invalidated for user ${userId}`);
    } catch (error) {
      console.error('Failed to invalidate sonic cache:', error);
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
          track_count,
          track_hash
        FROM sonic_palette_cache
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
        trackCount: cached.track_count,
        trackHash: cached.track_hash
      };
    } catch (error) {
      console.error('Failed to get sonic cache stats:', error);
      return { exists: false };
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new SonicPaletteCacheService();
