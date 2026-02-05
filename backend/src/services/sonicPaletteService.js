const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const sonicPaletteCache = require('./sonicPaletteCache');

/**
 * Sonic Palette Service
 * Extracts "sonic colors" from audio tracks - the audio equivalent of Visual DNA
 * Analyzes frequency spectrum, tonal characteristics, and sonic signatures
 */
class SonicPaletteService {
  constructor() {
    this.audioDbPath = path.join(__dirname, '../../starforge_audio.db');
    this.db = null;
  }

  /**
   * Get database connection
   */
  getDb() {
    if (!this.db) {
      if (!fs.existsSync(this.audioDbPath)) {
        console.warn('Audio database not found at:', this.audioDbPath);
        return null;
      }
      this.db = new Database(this.audioDbPath, { readonly: true });
    }
    return this.db;
  }

  /**
   * Get all tracks for a user
   */
  getAllTracks(userId = 'default_user', context = null) {
    const db = this.getDb();
    if (!db) return [];

    try {
      let query = 'SELECT * FROM audio_tracks WHERE 1=1';
      const params = [];

      if (context) {
        query += ' AND musical_context = ?';
        params.push(context);
      }

      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error getting tracks:', error);
      return [];
    }
  }

  /**
   * Extract sonic palette from user's track collection
   * Uses intelligent caching to avoid reprocessing
   *
   * @param {string} userId - User identifier for caching
   * @param {Array} tracks - Array of track objects from database
   * @param {boolean} forceRefresh - Skip cache and regenerate
   */
  async extractSonicPalette(userId = 'default_user', tracks = [], forceRefresh = false) {
    try {
      if (tracks.length === 0) {
        return {
          styleDescription: 'No tracks analyzed yet',
          confidence: 0,
          trackCount: 0
        };
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedPalette = sonicPaletteCache.getCached(userId, tracks);
        if (cachedPalette) {
          console.log(`Using cached Sonic Palette (${cachedPalette.cacheAge} minutes old)`);
          return cachedPalette;
        }
      }

      // Prepare track data for Python analyzer
      const tracksData = tracks.map(t => ({
        path: t.file_path,
        bpm: t.bpm || 120,
        energy: t.energy || 0.5,
        key: t.key,
        valence: t.valence
      }));

      // Write to temp file for Python script
      const tmpFile = `/tmp/sonic_palette_tracks_${Date.now()}.json`;
      fs.writeFileSync(tmpFile, JSON.stringify(tracksData));

      // Run sophisticated Python analysis
      const { spawn } = require('child_process');
      const pythonScript = path.join(__dirname, '../python/sonic_palette_analyzer.py');

      const result = await new Promise((resolve, reject) => {
        const python = spawn('python3', [pythonScript, tmpFile, '--json']);

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          // Clean up temp file
          try { fs.unlinkSync(tmpFile); } catch (e) {}

          if (code !== 0) {
            console.error('Python sonic palette analysis failed:', stderr);
            // Fall back to simple description
            resolve({
              styleDescription: this.generateSimpleSonicDescription(tracks),
              sonicPalette: [],
              confidence: 0.5
            });
          } else {
            try {
              const analysis = JSON.parse(stdout);
              resolve(analysis);
            } catch (error) {
              reject(new Error(`Failed to parse Python output: ${error.message}`));
            }
          }
        });
      });

      const sonicPalette = {
        ...result,
        trackCount: tracks.length
      };

      // Cache the results for future requests
      sonicPaletteCache.saveCache(userId, sonicPalette, tracks);

      return sonicPalette;
    } catch (error) {
      console.error('Error extracting sonic palette:', error);
      return {
        styleDescription: 'Error analyzing sonic palette',
        error: error.message,
        confidence: 0,
        trackCount: 0
      };
    }
  }

  /**
   * Refresh cache for a user
   */
  async refreshCache(userId, tracks) {
    sonicPaletteCache.invalidateCache(userId);
    return this.extractSonicPalette(userId, tracks, true);
  }

  /**
   * Generate simple sonic description (fallback)
   */
  generateSimpleSonicDescription(tracks) {
    if (tracks.length === 0) {
      return 'Sonic preferences still being learned';
    }

    const avgBpm = tracks.reduce((sum, t) => sum + (t.bpm || 0), 0) / tracks.length;
    const avgEnergy = tracks.reduce((sum, t) => sum + (t.energy || 0), 0) / tracks.length;

    let energyLevel = avgEnergy >= 0.7 ? 'high-energy' :
                     avgEnergy >= 0.5 ? 'dynamic' :
                     avgEnergy >= 0.3 ? 'balanced' : 'atmospheric';

    let tempoRange = avgBpm >= 140 ? 'uptempo' :
                    avgBpm >= 115 ? 'mid-tempo' :
                    avgBpm >= 90 ? 'steady-paced' : 'downtempo';

    return `${energyLevel} ${tempoRange} sonic palette`;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(userId = 'default_user', context = null) {
    const cacheKey = context ? `${userId}_${context}` : userId;
    return sonicPaletteCache.getCacheStats(cacheKey);
  }

  /**
   * Invalidate cache (force refresh on next request)
   */
  invalidateCache(userId = 'default_user', context = null) {
    const cacheKey = context ? `${userId}_${context}` : userId;
    sonicPaletteCache.invalidateCache(cacheKey);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new SonicPaletteService();
