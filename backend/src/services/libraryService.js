const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

/**
 * Library Service
 * Manages music library - CRUD operations, search, filter, pagination
 */
class LibraryService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../starforge_audio.db');
    this.db = null;
  }

  getDb() {
    if (!this.db) {
      this.db = new Database(this.dbPath);
    }
    return this.db;
  }

  /**
   * Get paginated library with filters
   */
  getLibrary(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'uploaded_at',
      sortOrder = 'DESC',
      search = '',
      minBpm = null,
      maxBpm = null,
      minEnergy = null,
      maxEnergy = null,
      genre = null,
      source = null
    } = options;

    const db = this.getDb();
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (search) {
      conditions.push('(filename LIKE ? OR rekordbox_comments LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minBpm !== null) {
      conditions.push('bpm >= ?');
      params.push(minBpm);
    }

    if (maxBpm !== null) {
      conditions.push('bpm <= ?');
      params.push(maxBpm);
    }

    if (minEnergy !== null) {
      conditions.push('energy >= ?');
      params.push(minEnergy);
    }

    if (maxEnergy !== null) {
      conditions.push('energy <= ?');
      params.push(maxEnergy);
    }

    if (source) {
      conditions.push('source = ?');
      params.push(source);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM audio_tracks WHERE ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Get paginated tracks
    const query = `
      SELECT
        id, filename, duration_seconds, bpm, key, energy, valence,
        star_rating, play_count, source, uploaded_at, rekordbox_comments
      FROM audio_tracks
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const tracks = db.prepare(query).all(...params, limit, offset);

    return {
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get quick library stats
   */
  getLibraryStats(userId) {
    const db = this.getDb();

    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalTracks,
        AVG(bpm) as avgBpm,
        AVG(energy) as avgEnergy,
        AVG(valence) as avgValence,
        MIN(uploaded_at) as firstUpload,
        MAX(uploaded_at) as lastUpload,
        SUM(play_count) as totalPlays,
        COUNT(DISTINCT source) as sourceCount
      FROM audio_tracks
      WHERE user_id = ?
    `).get(userId);

    // Get source breakdown
    const sources = db.prepare(`
      SELECT source, COUNT(*) as count
      FROM audio_tracks
      WHERE user_id = ?
      GROUP BY source
    `).all(userId);

    // Get BPM distribution
    const bpmRanges = db.prepare(`
      SELECT
        CASE
          WHEN bpm < 100 THEN '<100'
          WHEN bpm < 120 THEN '100-120'
          WHEN bpm < 130 THEN '120-130'
          WHEN bpm < 140 THEN '130-140'
          WHEN bpm < 150 THEN '140-150'
          ELSE '150+'
        END as range,
        COUNT(*) as count
      FROM audio_tracks
      WHERE user_id = ? AND bpm IS NOT NULL
      GROUP BY range
      ORDER BY range
    `).all(userId);

    // Get energy distribution
    const energyRanges = db.prepare(`
      SELECT
        CASE
          WHEN energy < 0.3 THEN 'Low'
          WHEN energy < 0.6 THEN 'Medium'
          ELSE 'High'
        END as range,
        COUNT(*) as count
      FROM audio_tracks
      WHERE user_id = ? AND energy IS NOT NULL
      GROUP BY range
    `).all(userId);

    return {
      ...stats,
      avgBpm: stats.avgBpm ? parseFloat(stats.avgBpm.toFixed(1)) : null,
      avgEnergy: stats.avgEnergy ? parseFloat(stats.avgEnergy.toFixed(2)) : null,
      avgValence: stats.avgValence ? parseFloat(stats.avgValence.toFixed(2)) : null,
      sources,
      bpmDistribution: bpmRanges,
      energyDistribution: energyRanges
    };
  }

  /**
   * Get single track details
   */
  getTrack(trackId) {
    const db = this.getDb();
    return db.prepare('SELECT * FROM audio_tracks WHERE id = ?').get(trackId);
  }

  /**
   * Delete track
   */
  deleteTrack(trackId, userId) {
    const db = this.getDb();
    const result = db.prepare('DELETE FROM audio_tracks WHERE id = ? AND user_id = ?').run(trackId, userId);
    return result.changes > 0;
  }

  /**
   * Bulk delete tracks
   */
  bulkDeleteTracks(trackIds, userId) {
    const db = this.getDb();
    const placeholders = trackIds.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM audio_tracks WHERE id IN (${placeholders}) AND user_id = ?`)
      .run(...trackIds, userId);
    return result.changes;
  }

  /**
   * Update track metadata
   */
  updateTrack(trackId, userId, updates) {
    const db = this.getDb();
    const allowedFields = ['star_rating', 'is_favorite', 'rekordbox_comments'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    const query = `UPDATE audio_tracks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    const result = db.prepare(query).run(...values, trackId, userId);
    return result.changes > 0;
  }

  /**
   * Calculate track hash for cache invalidation
   */
  calculateTrackHash(userId) {
    const db = this.getDb();
    const tracks = db.prepare('SELECT id, uploaded_at FROM audio_tracks WHERE user_id = ? ORDER BY id').all(userId);
    const hashString = tracks.map(t => t.id + t.uploaded_at).join('|');
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  /**
   * Search tracks
   */
  searchTracks(userId, query, limit = 20) {
    const db = this.getDb();
    const tracks = db.prepare(`
      SELECT id, filename, bpm, energy, key, uploaded_at
      FROM audio_tracks
      WHERE user_id = ? AND (filename LIKE ? OR rekordbox_comments LIKE ?)
      ORDER BY uploaded_at DESC
      LIMIT ?
    `).all(userId, `%${query}%`, `%${query}%`, limit);

    return tracks;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new LibraryService();
