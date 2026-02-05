const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sonicPaletteCache = require('./sonicPaletteCache');

/**
 * Sonic Palette Service
 * Audio equivalent of Visual DNA - extracts frequency spectrum and tonal characteristics
 * Mirrors architecture of clarosaServiceDirect.js
 */
class SonicPaletteService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../python/sonic_palette_analyzer.py');
  }

  /**
   * Extract sonic palette from user's audio catalog
   * Uses intelligent caching to avoid reprocessing
   */
  async extractSonicPalette(userId, tracks, forceRefresh = false) {
    try {
      if (!tracks || tracks.length === 0) {
        return {
          sonicPalette: [],
          tonalCharacteristics: 'No tracks analyzed yet',
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
        path: t.file_path || t.path,
        qualityScore: t.quality_score || t.qualityScore || 0,
        analysis: t.analysis || {}
      }));

      // Write to temp file for Python script
      const tmpFile = `/tmp/audio_tracks_${Date.now()}.json`;
      fs.writeFileSync(tmpFile, JSON.stringify(tracksData));

      // Run Python analysis
      const result = await this.runPythonAnalysis(tmpFile);

      // Clean up temp file
      try { fs.unlinkSync(tmpFile); } catch (e) {}

      if (!result || result.error) {
        console.error('Python sonic palette analysis failed:', result?.error);
        return this.generateFallbackPalette(tracks);
      }

      const sonicData = {
        ...result,
        trackCount: tracks.length
      };

      // Cache the results for future requests
      sonicPaletteCache.saveCache(userId, sonicData, tracks);

      return sonicData;
    } catch (error) {
      console.error('Error extracting sonic palette:', error);
      return this.generateFallbackPalette(tracks);
    }
  }

  /**
   * Run Python sonic palette analyzer
   */
  async runPythonAnalysis(tmpFile) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.pythonScript, tmpFile, '--json']);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python sonic palette analysis failed:', stderr);
          resolve({ error: stderr });
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        }
      });
    });
  }

  /**
   * Generate fallback palette from basic track analysis
   * Used when Python analysis fails
   */
  generateFallbackPalette(tracks) {
    // Calculate simple statistics from track metadata
    const avgEnergy = tracks.reduce((sum, t) => sum + (t.energy || 0.5), 0) / tracks.length;
    const avgValence = tracks.reduce((sum, t) => sum + (t.valence || 0.5), 0) / tracks.length;

    // Infer basic frequency distribution from energy/valence
    const sonicPalette = [
      {
        band: 'mid',
        bandLabel: 'Mid (500-2kHz)',
        prominence: 0.8,
        energyDb: -10
      },
      {
        band: avgEnergy > 0.6 ? 'bass' : 'treble',
        bandLabel: avgEnergy > 0.6 ? 'Bass (60-250Hz)' : 'Treble (6kHz+)',
        prominence: 0.6,
        energyDb: -15
      }
    ];

    const tonal = avgValence > 0.6 ? 'bright' : avgValence < 0.4 ? 'dark' : 'balanced';
    const energy = avgEnergy > 0.6 ? 'energetic' : 'calm';

    return {
      sonicPalette,
      tonalCharacteristics: `${tonal} ${energy} sonic aesthetic`,
      dominantFrequencies: sonicPalette.slice(0, 2).map(p => ({
        band: p.bandLabel,
        prominence: p.prominence
      })),
      totalAnalyzed: tracks.length,
      highQualityCount: tracks.filter(t => (t.quality_score || 0) > 0.7).length,
      confidence: 0.3,
      trackCount: tracks.length,
      fallback: true
    };
  }

  /**
   * Refresh sonic palette cache
   */
  async refreshCache(userId, tracks) {
    sonicPaletteCache.invalidateCache(userId);
    return await this.extractSonicPalette(userId, tracks, true);
  }

  /**
   * Get cache stats
   */
  getCacheStats(userId) {
    return sonicPaletteCache.getCacheStats(userId);
  }
}

module.exports = new SonicPaletteService();
