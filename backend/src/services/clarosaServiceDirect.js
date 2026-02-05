const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Direct CLAROSA Database Connection
 * Queries SQLite database directly for faster access
 */
class ClarosaDirectService {
  constructor() {
    this.dbPath = process.env.CLAROSA_DB_PATH || '/home/sphinxy/clarosa/backend/clarosa.db';
    this.storagePath = process.env.CLAROSA_STORAGE || '/home/sphinxy/clarosa/backend/storage';
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  connect() {
    if (!fs.existsSync(this.dbPath)) {
      console.warn('CLAROSA database not found at:', this.dbPath);
      return false;
    }

    try {
      this.db = new Database(this.dbPath, { readonly: true });
      console.log('✓ Connected to CLAROSA database');
      return true;
    } catch (error) {
      console.error('Failed to connect to CLAROSA:', error.message);
      return false;
    }
  }

  /**
   * Get user's profile and stats
   * Note: CLAROSA is single-user system, no user_id filtering on photos
   */
  getUserProfile(userId = 1) {
    if (!this.db) this.connect();
    if (!this.db) return null;

    try {
      // Get taste profile (may have user_id or be null)
      const profile = this.db.prepare(`
        SELECT * FROM taste_profiles
        ORDER BY updated_at DESC
        LIMIT 1
      `).get();

      // Get photo stats (no user_id in photos table)
      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total_photos,
          AVG(clarosa_score) as avg_score,
          MAX(clarosa_score) as max_score,
          MIN(clarosa_score) as min_score,
          SUM(CASE WHEN clarosa_score >= 0.80 THEN 1 ELSE 0 END) as highlight_count,
          SUM(CASE WHEN clarosa_score >= 0.60 AND clarosa_score < 0.80 THEN 1 ELSE 0 END) as keep_count,
          SUM(CASE WHEN clarosa_score < 0.35 THEN 1 ELSE 0 END) as delete_count
        FROM photos
        WHERE deleted_at IS NULL
      `).get();

      // Get training stats (single user)
      const training = this.db.prepare(`
        SELECT
          COUNT(DISTINCT session_id) as training_sessions,
          COUNT(*) as total_comparisons,
          AVG(decision_time_ms) as avg_decision_time
        FROM training_comparisons
      `).get();

      return {
        profile: profile || {
          user_id: userId,
          confidence_score: 0,
          training_samples_count: 0,
          comparisons_count: 0
        },
        stats: stats || {},
        training: training || {}
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get user's top-rated photos with full details
   * Note: clarosa_score is 0-1 scale (not 0-100)
   */
  getTopPhotos(userId = 1, limit = 20, minScore = 0.60) {
    if (!this.db) this.connect();
    if (!this.db) return [];

    try {
      // Convert minScore to 0-1 scale if provided as 0-100
      const normalizedMinScore = minScore > 1 ? minScore / 100 : minScore;

      const photos = this.db.prepare(`
        SELECT
          id,
          file_path,
          file_url,
          clarosa_score,
          global_score_0_100,
          personal_taste_score_0_100,
          stars_0_5,
          quality_score,
          aesthetic_score,
          tags,
          taken_at,
          uploaded_at,
          scored_at
        FROM photos
        WHERE deleted_at IS NULL
          AND clarosa_score IS NOT NULL
          AND clarosa_score >= ?
        ORDER BY clarosa_score DESC
        LIMIT ?
      `).all(normalizedMinScore, limit);

      return photos.map(photo => ({
        ...photo,
        // Convert 0-1 score to 0-100 for display
        clarosa_score: Math.round(photo.clarosa_score * 100),
        tags: photo.tags ? (typeof photo.tags === 'string' ? JSON.parse(photo.tags) : photo.tags) : [],
        fullPath: path.join(this.storagePath, 'photos', path.basename(photo.file_path || ''))
      }));
    } catch (error) {
      console.error('Error getting top photos:', error);
      return [];
    }
  }

  /**
   * Get photos grouped by curation category
   * Note: clarosa_score is 0-1 scale
   */
  getCurationCategories(userId = 1) {
    if (!this.db) this.connect();
    if (!this.db) return null;

    try {
      return {
        highlight: this.db.prepare(`
          SELECT * FROM photos
          WHERE deleted_at IS NULL AND clarosa_score >= 0.80
          ORDER BY clarosa_score DESC LIMIT 10
        `).all(),

        keep: this.db.prepare(`
          SELECT * FROM photos
          WHERE deleted_at IS NULL
            AND clarosa_score >= 0.60 AND clarosa_score < 0.80
          ORDER BY clarosa_score DESC LIMIT 20
        `).all(),

        review: this.db.prepare(`
          SELECT * FROM photos
          WHERE deleted_at IS NULL
            AND clarosa_score > 0.35 AND clarosa_score < 0.60
          ORDER BY clarosa_score DESC LIMIT 20
        `).all(),

        delete: this.db.prepare(`
          SELECT * FROM photos
          WHERE deleted_at IS NULL AND clarosa_score <= 0.35
          ORDER BY clarosa_score ASC LIMIT 10
        `).all()
      };
    } catch (error) {
      console.error('Error getting curation categories:', error);
      return null;
    }
  }

  /**
   * Extract visual DNA from user's photos
   * Sophisticated analysis with color extraction and marketing-grade descriptions
   */
  async extractVisualDNA(userId = 1) {
    if (!this.db) this.connect();
    if (!this.db) return null;

    try {
      // Get ALL photos for comprehensive analysis (using 0-1 scale)
      const allPhotos = this.getTopPhotos(userId, 500, 0.0);

      if (allPhotos.length === 0) {
        return {
          styleDescription: 'No photos analyzed yet',
          confidence: 0,
          photoCount: 0
        };
      }

      // Prepare photo data for Python analyzer
      const photosData = allPhotos.map(p => ({
        path: p.fullPath,
        score: p.clarosa_score,
        tags: p.tags || []
      }));

      // Write to temp file for Python script
      const tmpFile = `/tmp/clarosa_photos_${Date.now()}.json`;
      fs.writeFileSync(tmpFile, JSON.stringify(photosData));

      // Run sophisticated Python analysis
      const { spawn } = require('child_process');
      const pythonScript = path.join(__dirname, '../python/visual_dna_analyzer.py');

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
            console.error('Python visual DNA analysis failed:', stderr);
            // Fall back to simple description
            resolve({
              styleDescription: this.generateSimpleStyleDescription(allPhotos),
              colorPalette: [],
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

      // Get profile confidence
      const profile = this.getUserProfile(userId);
      const confidence = profile?.profile?.confidence_score || result.confidence || 0;

      return {
        ...result,
        confidence,
        photoCount: allPhotos.length
      };
    } catch (error) {
      console.error('Error extracting visual DNA:', error);
      return null;
    }
  }

  /**
   * Generate simple style description (fallback)
   */
  generateSimpleStyleDescription(photos) {
    if (photos.length === 0) {
      return 'Aesthetic preferences still being learned';
    }

    // Extract tags
    const allTags = photos.flatMap(p => p.tags || []).filter(t => t);
    const tagFreq = {};
    allTags.forEach(tag => {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1;
    });

    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    const avgScore = photos.reduce((sum, p) => sum + (p.clarosa_score || 0), 0) / photos.length;

    const qualityLevel = avgScore >= 85 ? 'refined' :
                        avgScore >= 70 ? 'curated' :
                        avgScore >= 50 ? 'evolving' : 'experimental';

    return `${qualityLevel} aesthetic with ${topTags.join(', ')} influences`;
  }

  /**
   * Get recent comparisons for activity tracking
   */
  getRecentActivity(userId = 1, limit = 10) {
    if (!this.db) this.connect();
    if (!this.db) return [];

    try {
      return this.db.prepare(`
        SELECT
          tc.*,
          pa.file_path as photo_a_path,
          pb.file_path as photo_b_path
        FROM training_comparisons tc
        LEFT JOIN photos pa ON tc.photo_a_id = pa.id
        LEFT JOIN photos pb ON tc.photo_b_id = pb.id
        WHERE tc.user_id = ?
        ORDER BY tc.created_at DESC
        LIMIT ?
      `).all(userId, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
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

module.exports = new ClarosaDirectService();
