const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Rekordbox Database Reader
 * Reads master.db directly from local Rekordbox installation or USB drive
 * Gets complete metadata including play counts, ratings, play history
 *
 * Legal: Read-only access to user's own data
 * Fast: Direct SQLite queries (no XML export needed)
 * Complete: Gets ALL metadata including play history
 */
class RekordboxDatabaseReader {
  constructor() {
    this.dbPath = null;
  }

  /**
   * Auto-detect Rekordbox database on local computer
   * Searches common installation paths for Windows and Mac
   */
  findLocalRekordboxDatabase() {
    const platform = os.platform();
    let searchPaths = [];

    if (platform === 'win32') {
      // Windows paths
      searchPaths = [
        path.join(os.homedir(), 'AppData/Roaming/Pioneer/rekordbox/master.db'),
        path.join(os.homedir(), 'AppData/Roaming/Pioneer/rekordbox6/master.db'),
        path.join(os.homedir(), 'AppData/Local/Pioneer/rekordbox/master.db'),
      ];
    } else if (platform === 'darwin') {
      // Mac paths
      searchPaths = [
        path.join(os.homedir(), 'Library/Pioneer/rekordbox/master.db'),
        path.join(os.homedir(), 'Library/Pioneer/rekordbox6/master.db'),
        path.join(os.homedir(), 'Library/Application Support/Pioneer/rekordbox/master.db'),
      ];
    } else if (platform === 'linux') {
      // Linux/WSL paths
      searchPaths = [
        // Wine paths
        path.join(os.homedir(), '.wine/drive_c/users', os.userInfo().username, 'AppData/Roaming/Pioneer/rekordbox/master.db'),
      ];

      // WSL: Check Windows file system
      // Try to find Windows users and check their AppData
      try {
        if (fs.existsSync('/mnt/c/Users')) {
          const users = fs.readdirSync('/mnt/c/Users').filter(u =>
            !['All Users', 'Default', 'Default User', 'Public'].includes(u) &&
            !u.endsWith('.ini') && !u.endsWith('.log')
          );

          for (const user of users) {
            searchPaths.push(`/mnt/c/Users/${user}/AppData/Roaming/Pioneer/rekordbox/master.db`);
            searchPaths.push(`/mnt/c/Users/${user}/AppData/Roaming/Pioneer/rekordbox6/master.db`);
          }
        }
      } catch (error) {
        console.log('Could not scan WSL Windows users:', error.message);
      }
    }

    for (const dbPath of searchPaths) {
      if (fs.existsSync(dbPath)) {
        this.dbPath = dbPath;
        console.log('✅ Found Rekordbox database:', dbPath);
        return dbPath;
      }
    }

    console.log('❌ Rekordbox database not found in standard locations');
    return null;
  }

  /**
   * Find Rekordbox database on USB drive
   * Looks for PIONEER/rekordbox/ with master.db or exportLibrary.db
   */
  findUSBRekordboxDatabase(usbPath) {
    const possiblePaths = [
      // USB export database (most common for DJ USBs)
      path.join(usbPath, 'PIONEER/rekordbox/exportLibrary.db'),
      path.join(usbPath, 'Pioneer/rekordbox/exportLibrary.db'),
      path.join(usbPath, 'pioneer/rekordbox/exportLibrary.db'),
      // Master database (if copied manually)
      path.join(usbPath, 'PIONEER/rekordbox/master.db'),
      path.join(usbPath, 'Pioneer/rekordbox/master.db'),
      path.join(usbPath, 'pioneer/rekordbox/master.db'),
    ];

    for (const dbPath of possiblePaths) {
      if (fs.existsSync(dbPath)) {
        this.dbPath = dbPath;
        console.log('✅ Found Rekordbox database on USB:', dbPath);
        return dbPath;
      }
    }

    console.log('❌ Rekordbox database not found on USB:', usbPath);
    return null;
  }

  /**
   * Detect all available USB drives
   * Returns array of mount points
   */
  detectUSBDrives() {
    const platform = os.platform();
    const drives = [];

    if (platform === 'win32') {
      // Windows: Check drive letters D: through Z:
      for (let i = 68; i <= 90; i++) { // ASCII 68='D', 90='Z'
        const drive = String.fromCharCode(i) + ':\\';
        if (fs.existsSync(drive)) {
          // Check if it has PIONEER folder (likely a DJ USB)
          const hasPioneer = fs.existsSync(path.join(drive, 'PIONEER'));
          drives.push({
            path: drive,
            label: drive,
            hasPioneer
          });
        }
      }
    } else if (platform === 'darwin') {
      // Mac: Check /Volumes
      const volumesPath = '/Volumes';
      if (fs.existsSync(volumesPath)) {
        const volumes = fs.readdirSync(volumesPath);
        for (const volume of volumes) {
          const volumePath = path.join(volumesPath, volume);
          const hasPioneer = fs.existsSync(path.join(volumePath, 'PIONEER'));
          drives.push({
            path: volumePath,
            label: volume,
            hasPioneer
          });
        }
      }
    } else if (platform === 'linux') {
      // Linux: Check /media and /mnt
      const mediaPaths = ['/media', '/mnt'];
      for (const mediaPath of mediaPaths) {
        if (fs.existsSync(mediaPath)) {
          const mounts = fs.readdirSync(mediaPath);
          for (const mount of mounts) {
            const mountPath = path.join(mediaPath, mount);
            const hasPioneer = fs.existsSync(path.join(mountPath, 'PIONEER'));
            drives.push({
              path: mountPath,
              label: mount,
              hasPioneer
            });
          }
        }
      }
    }

    return drives;
  }

  /**
   * Read database info without importing all tracks
   * Quick preview of what's in the database
   */
  getDatabaseInfo(dbPath) {
    let tempDbPath = null;

    try {
      // For WSL/Windows file system, copy to temp location first
      // This avoids file locking issues when Rekordbox is running
      const isWSL = dbPath.startsWith('/mnt/');
      let actualDbPath = dbPath;

      if (isWSL) {
        // Copy database to temp location in Linux file system
        // Need to copy all WAL files (.db, .db-shm, .db-wal) for databases in WAL mode
        tempDbPath = `/tmp/rekordbox_${Date.now()}.db`;
        fs.copyFileSync(dbPath, tempDbPath);

        // Copy WAL files if they exist
        const shmPath = dbPath + '-shm';
        const walPath = dbPath + '-wal';
        if (fs.existsSync(shmPath)) {
          fs.copyFileSync(shmPath, tempDbPath + '-shm');
        }
        if (fs.existsSync(walPath)) {
          fs.copyFileSync(walPath, tempDbPath + '-wal');
        }

        actualDbPath = tempDbPath;
        console.log('📋 Copied WSL database (with WAL files) to temp location for reading');
      }

      const db = new Database(actualDbPath, { readonly: true, fileMustExist: true });

      const info = {
        path: dbPath,
        totalTracks: db.prepare('SELECT COUNT(*) as count FROM djmdContent').get().count,
        totalPlays: db.prepare('SELECT COALESCE(SUM(PlayCount), 0) as sum FROM djmdPlayCount').get().sum,
        ratedTracks: db.prepare('SELECT COUNT(*) as count FROM djmdContent WHERE Rating > 0').get().count,
        avgRating: db.prepare('SELECT AVG(Rating) as avg FROM djmdContent WHERE Rating > 0').get().avg,
        playlists: db.prepare('SELECT COUNT(*) as count FROM djmdPlaylist').get().count,
        genres: db.prepare('SELECT COUNT(DISTINCT Genre) as count FROM djmdContent WHERE Genre IS NOT NULL').get().count
      };

      db.close();

      // Clean up temp files if created (including WAL files)
      if (tempDbPath) {
        if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
        if (fs.existsSync(tempDbPath + '-shm')) fs.unlinkSync(tempDbPath + '-shm');
        if (fs.existsSync(tempDbPath + '-wal')) fs.unlinkSync(tempDbPath + '-wal');
      }

      return info;
    } catch (error) {
      // Clean up temp files if created (including WAL files)
      if (tempDbPath) {
        try {
          if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
          if (fs.existsSync(tempDbPath + '-shm')) fs.unlinkSync(tempDbPath + '-shm');
          if (fs.existsSync(tempDbPath + '-wal')) fs.unlinkSync(tempDbPath + '-wal');
        } catch (e) {}
      }

      // Check if it's an encrypted USB export database
      if (error.code === 'SQLITE_NOTADB' && dbPath.includes('exportLibrary')) {
        console.error('❌ USB export database is encrypted:', dbPath);
        return {
          encrypted: true,
          path: dbPath,
          error: 'USB export database is encrypted by Rekordbox. Use local Rekordbox scan or XML export instead.'
        };
      }
      console.error('Error reading database info:', error);
      return null;
    }
  }

  /**
   * Read all tracks from database with complete metadata
   * Includes play counts, ratings, play history, comments, playlists
   */
  async readAllTracks(dbPath) {
    if (!dbPath) {
      dbPath = this.dbPath;
    }

    if (!dbPath) {
      throw new Error('No database path specified');
    }

    console.log('📖 Reading Rekordbox database:', dbPath);

    // Open database READ-ONLY (important for safety and legality)
    // For WSL, copy to temp location first to avoid file locking issues
    const isWSL = dbPath.startsWith('/mnt/');
    let actualDbPath = dbPath;
    let tempDbPath = null;

    if (isWSL) {
      tempDbPath = `/tmp/rekordbox_${Date.now()}.db`;
      console.log('📋 Copying WSL database to temp location...');
      fs.copyFileSync(dbPath, tempDbPath);

      // Copy WAL files if they exist
      const shmPath = dbPath + '-shm';
      const walPath = dbPath + '-wal';
      if (fs.existsSync(shmPath)) {
        fs.copyFileSync(shmPath, tempDbPath + '-shm');
      }
      if (fs.existsSync(walPath)) {
        fs.copyFileSync(walPath, tempDbPath + '-wal');
      }

      actualDbPath = tempDbPath;
    }

    const db = new Database(actualDbPath, { readonly: true, fileMustExist: true });

    try {
      // Get total count
      const { total } = db.prepare('SELECT COUNT(*) as total FROM djmdContent').get();
      console.log(`📊 Found ${total} tracks in database`);

      // Read all tracks with complete metadata
      // Using LEFT JOINs to get optional data (play counts, history, comments)
      const tracks = db.prepare(`
        SELECT
          c.ID as rekordbox_id,
          c.Title as title,
          c.Artist as artist,
          c.Album as album,
          c.Genre as genre,
          c.BPM as bpm,
          c.Key as key,
          c.Duration as duration_ms,
          c.Rating as star_rating,
          c.Color as color,
          c.DateAdded as date_added,
          c.FolderPath as file_path,
          COALESCE(p.PlayCount, 0) as play_count,
          h.last_played,
          cm.Comment as comments
        FROM djmdContent c
        LEFT JOIN djmdPlayCount p ON c.ID = p.ContentID
        LEFT JOIN (
          SELECT ContentID, MAX(DateCreated) as last_played
          FROM djmdHistory
          GROUP BY ContentID
        ) h ON c.ID = h.ContentID
        LEFT JOIN djmdComment cm ON c.ID = cm.ContentID
        WHERE c.FolderPath IS NOT NULL
        ORDER BY COALESCE(p.PlayCount, 0) DESC, c.Title ASC
      `).all();

      console.log(`✅ Successfully read ${tracks.length} tracks`);

      // Get additional statistics
      const stats = this.calculateStatistics(db);

      db.close();

      // Clean up temp file if created
      if (tempDbPath && fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
        console.log('🧹 Cleaned up temp database file');
      }

      return {
        total,
        tracks,
        stats,
        source: 'rekordbox_database',
        dbPath
      };
    } catch (error) {
      db.close();

      // Clean up temp files if created (including WAL files)
      if (tempDbPath) {
        try {
          if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
          if (fs.existsSync(tempDbPath + '-shm')) fs.unlinkSync(tempDbPath + '-shm');
          if (fs.existsSync(tempDbPath + '-wal')) fs.unlinkSync(tempDbPath + '-wal');
        } catch (e) {}
      }

      console.error('❌ Error reading tracks:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from database
   */
  calculateStatistics(db) {
    try {
      // Most played tracks
      const mostPlayed = db.prepare(`
        SELECT c.Title, c.Artist, p.PlayCount
        FROM djmdContent c
        JOIN djmdPlayCount p ON c.ID = p.ContentID
        WHERE p.PlayCount > 0
        ORDER BY p.PlayCount DESC
        LIMIT 10
      `).all();

      // Least played favorites (high rating but low plays)
      const leastPlayedFavorites = db.prepare(`
        SELECT c.Title, c.Artist, c.Rating, COALESCE(p.PlayCount, 0) as PlayCount
        FROM djmdContent c
        LEFT JOIN djmdPlayCount p ON c.ID = p.ContentID
        WHERE c.Rating >= 4
        ORDER BY PlayCount ASC
        LIMIT 10
      `).all();

      // Genre distribution
      const genreDistribution = db.prepare(`
        SELECT Genre, COUNT(*) as count
        FROM djmdContent
        WHERE Genre IS NOT NULL
        GROUP BY Genre
        ORDER BY count DESC
        LIMIT 10
      `).all();

      // Rating distribution
      const ratingDistribution = db.prepare(`
        SELECT Rating, COUNT(*) as count
        FROM djmdContent
        WHERE Rating > 0
        GROUP BY Rating
        ORDER BY Rating DESC
      `).all();

      // BPM range
      const bpmRange = db.prepare(`
        SELECT
          MIN(BPM) as min_bpm,
          MAX(BPM) as max_bpm,
          AVG(BPM) as avg_bpm
        FROM djmdContent
        WHERE BPM > 0
      `).get();

      return {
        mostPlayed,
        leastPlayedFavorites,
        topGenres: genreDistribution,
        ratingDistribution,
        bpmRange,
        totalPlays: db.prepare('SELECT COALESCE(SUM(PlayCount), 0) as sum FROM djmdPlayCount').get().sum,
        avgRating: db.prepare('SELECT AVG(Rating) as avg FROM djmdContent WHERE Rating > 0').get().avg
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {};
    }
  }

  /**
   * Read playlists from database
   */
  readPlaylists(dbPath) {
    if (!dbPath) {
      dbPath = this.dbPath;
    }

    const db = new Database(dbPath, { readonly: true });

    try {
      const playlists = db.prepare(`
        SELECT
          p.ID as playlist_id,
          p.Name as name,
          COUNT(sp.TrackID) as track_count
        FROM djmdPlaylist p
        LEFT JOIN djmdSongPlaylist sp ON p.ID = sp.PlaylistID
        GROUP BY p.ID, p.Name
        ORDER BY p.Name
      `).all();

      db.close();
      return playlists;
    } catch (error) {
      db.close();
      console.error('Error reading playlists:', error);
      return [];
    }
  }

  /**
   * Get play history for specific track
   */
  getTrackHistory(dbPath, rekordboxId) {
    const db = new Database(dbPath, { readonly: true });

    try {
      const history = db.prepare(`
        SELECT
          DateCreated as played_at,
          UUID as session_id
        FROM djmdHistory
        WHERE ContentID = ?
        ORDER BY DateCreated DESC
      `).all(rekordboxId);

      db.close();
      return history;
    } catch (error) {
      db.close();
      return [];
    }
  }
}

module.exports = new RekordboxDatabaseReader();
