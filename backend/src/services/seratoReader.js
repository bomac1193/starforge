const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Serato Library Reader
 * Reads database V2 from local Serato DJ installation
 * Gets complete metadata including play history, crates, loops, cue points
 *
 * Serato Database Location:
 * - Mac: ~/Music/_Serato_/database V2
 * - Windows: C:\Users\[username]\Music\_Serato_\database V2
 * - Linux/Wine: ~/.wine/drive_c/users/[username]/Music/_Serato_/database V2
 */
class SeratoReader {
  constructor() {
    this.dbPath = null;
  }

  /**
   * Auto-detect Serato database on local computer
   * Searches common installation paths for Windows, Mac, and Linux
   */
  findLocalSeratoDatabase() {
    const platform = os.platform();
    let searchPaths = [];

    if (platform === 'win32') {
      // Windows paths
      searchPaths = [
        path.join(os.homedir(), 'Music\\_Serato_\\database V2'),
        path.join(os.homedir(), 'Documents\\Music\\_Serato_\\database V2'),
        // Also check without extension (older versions)
        path.join(os.homedir(), 'Music\\_Serato_\\database'),
      ];
    } else if (platform === 'darwin') {
      // Mac paths
      searchPaths = [
        path.join(os.homedir(), 'Music/_Serato_/database V2'),
        path.join(os.homedir(), 'Documents/Music/_Serato_/database V2'),
      ];
    } else if (platform === 'linux') {
      // Linux/WSL paths
      searchPaths = [
        // Wine paths
        path.join(os.homedir(), '.wine/drive_c/users', os.userInfo().username, 'Music/_Serato_/database V2'),
      ];

      // WSL: Check Windows file system
      try {
        if (fs.existsSync('/mnt/c/Users')) {
          const users = fs.readdirSync('/mnt/c/Users').filter(u =>
            !['All Users', 'Default', 'Default User', 'Public'].includes(u) &&
            !u.endsWith('.ini') && !u.endsWith('.log')
          );

          for (const user of users) {
            searchPaths.push(`/mnt/c/Users/${user}/Music/_Serato_/database V2`);
            searchPaths.push(`/mnt/c/Users/${user}/Documents/Music/_Serato_/database V2`);
          }
        }
      } catch (error) {
        console.log('Could not scan WSL Windows users:', error.message);
      }
    }

    for (const dbPath of searchPaths) {
      if (fs.existsSync(dbPath)) {
        this.dbPath = dbPath;
        console.log('Found Serato database:', dbPath);
        return dbPath;
      }
    }

    console.log('Serato database not found in standard locations');
    return null;
  }

  /**
   * Read database info without importing all tracks
   * Quick preview of what's in the database
   */
  getDatabaseInfo(dbPath) {
    if (!dbPath) {
      dbPath = this.dbPath;
    }

    if (!dbPath || !fs.existsSync(dbPath)) {
      console.log('Database path does not exist:', dbPath);
      return null;
    }

    try {
      const db = new Database(dbPath, { readonly: true, fileMustExist: true });

      // Check what tables exist in the database
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('Serato database tables:', tables.map(t => t.name).join(', '));

      // Try to get track count from most common table names
      let totalTracks = 0;
      let crateCount = 0;

      try {
        // Serato typically uses 'track' table
        totalTracks = db.prepare('SELECT COUNT(*) as count FROM track').get().count;
      } catch (e) {
        // If 'track' doesn't exist, try other common names
        try {
          totalTracks = db.prepare('SELECT COUNT(*) as count FROM tracks').get().count;
        } catch (e2) {
          console.log('Could not determine track count');
        }
      }

      try {
        // Try to get crate count
        crateCount = db.prepare('SELECT COUNT(*) as count FROM crate').get().count;
      } catch (e) {
        try {
          crateCount = db.prepare('SELECT COUNT(*) as count FROM crates').get().count;
        } catch (e2) {
          console.log('Could not determine crate count');
        }
      }

      const info = {
        path: dbPath,
        totalTracks,
        crateCount,
        tables: tables.map(t => t.name)
      };

      db.close();
      return info;
    } catch (error) {
      console.error('Error reading Serato database info:', error);
      return null;
    }
  }

  /**
   * Read all tracks from Serato database
   * Includes metadata, play history, crates
   */
  async readAllTracks(dbPath) {
    if (!dbPath) {
      dbPath = this.dbPath;
    }

    if (!dbPath) {
      throw new Error('No database path specified');
    }

    console.log('Reading Serato database:', dbPath);

    // For WSL, copy to temp location to avoid file locking issues
    const isWSL = dbPath.startsWith('/mnt/');
    let actualDbPath = dbPath;
    let tempDbPath = null;

    if (isWSL) {
      tempDbPath = `/tmp/serato_${Date.now()}.db`;
      console.log('Copying WSL database to temp location...');

      try {
        fs.copyFileSync(dbPath, tempDbPath);
        actualDbPath = tempDbPath;
        console.log('Database copied successfully');
      } catch (copyError) {
        console.error('Failed to copy database:', copyError.message);
        throw new Error('Cannot access Serato database. Make sure Serato DJ is closed.');
      }
    }

    const db = new Database(actualDbPath, { readonly: true, fileMustExist: true });

    try {
      // First, inspect the schema to understand the database structure
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('Available tables:', tables.map(t => t.name).join(', '));

      // Get columns from track table
      let trackTableName = 'track';
      try {
        db.prepare('SELECT * FROM track LIMIT 1').get();
      } catch (e) {
        // Try 'tracks' if 'track' doesn't exist
        trackTableName = 'tracks';
      }

      const columns = db.prepare(`PRAGMA table_info(${trackTableName})`).all();
      console.log('Track table columns:', columns.map(c => c.name).join(', '));

      // Build dynamic query based on available columns
      const columnNames = columns.map(c => c.name);

      // Map Serato columns to our schema
      const columnMapping = {
        id: columnNames.find(c => c.toLowerCase() === 'id' || c.toLowerCase() === 'trackid'),
        title: columnNames.find(c => c.toLowerCase().includes('title') || c.toLowerCase().includes('name')),
        artist: columnNames.find(c => c.toLowerCase().includes('artist')),
        album: columnNames.find(c => c.toLowerCase().includes('album')),
        genre: columnNames.find(c => c.toLowerCase().includes('genre')),
        bpm: columnNames.find(c => c.toLowerCase() === 'bpm' || c.toLowerCase().includes('tempo')),
        key: columnNames.find(c => c.toLowerCase() === 'key' || c.toLowerCase().includes('key')),
        duration: columnNames.find(c => c.toLowerCase().includes('length') || c.toLowerCase().includes('duration')),
        location: columnNames.find(c => c.toLowerCase().includes('location') || c.toLowerCase().includes('path') || c.toLowerCase().includes('file')),
        dateAdded: columnNames.find(c => c.toLowerCase().includes('date') || c.toLowerCase().includes('added') || c.toLowerCase().includes('imported')),
        playCount: columnNames.find(c => c.toLowerCase().includes('playcount') || c.toLowerCase().includes('played')),
      };

      console.log('Column mapping:', columnMapping);

      // Build SELECT clause with available columns
      const selectParts = [];
      if (columnMapping.id) selectParts.push(`${columnMapping.id} as serato_id`);
      if (columnMapping.title) selectParts.push(`${columnMapping.title} as title`);
      if (columnMapping.artist) selectParts.push(`${columnMapping.artist} as artist`);
      if (columnMapping.album) selectParts.push(`${columnMapping.album} as album`);
      if (columnMapping.genre) selectParts.push(`${columnMapping.genre} as genre`);
      if (columnMapping.bpm) selectParts.push(`${columnMapping.bpm} as bpm`);
      if (columnMapping.key) selectParts.push(`${columnMapping.key} as key`);
      if (columnMapping.duration) selectParts.push(`${columnMapping.duration} as duration_ms`);
      if (columnMapping.location) selectParts.push(`${columnMapping.location} as file_path`);
      if (columnMapping.dateAdded) selectParts.push(`${columnMapping.dateAdded} as date_added`);
      if (columnMapping.playCount) selectParts.push(`${columnMapping.playCount} as play_count`);

      if (selectParts.length === 0) {
        throw new Error('Could not map any columns from Serato database');
      }

      const query = `SELECT ${selectParts.join(', ')} FROM ${trackTableName} WHERE ${columnMapping.location} IS NOT NULL`;
      console.log('Executing query:', query);

      const tracks = db.prepare(query).all();
      console.log(`Successfully read ${tracks.length} tracks from Serato`);

      // Try to get crates (playlists)
      let crates = [];
      try {
        const crateTableName = tables.find(t => t.name.toLowerCase().includes('crate')) || 'crate';
        crates = db.prepare(`SELECT * FROM ${crateTableName.name || crateTableName}`).all();
        console.log(`Found ${crates.length} crates`);
      } catch (e) {
        console.log('Could not read crates:', e.message);
      }

      db.close();

      // Clean up temp file if created
      if (tempDbPath && fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
        console.log('Cleaned up temp database file');
      }

      return {
        total: tracks.length,
        tracks,
        crates,
        source: 'serato_database',
        dbPath
      };
    } catch (error) {
      db.close();

      // Clean up temp file if created
      if (tempDbPath && fs.existsSync(tempDbPath)) {
        try {
          fs.unlinkSync(tempDbPath);
        } catch (e) {}
      }

      console.error('Error reading Serato tracks:', error);
      throw error;
    }
  }

  /**
   * Read crates (playlists) from Serato database
   */
  async readCrates(dbPath) {
    if (!dbPath) {
      dbPath = this.dbPath;
    }

    const db = new Database(dbPath, { readonly: true });

    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const crateTableName = tables.find(t => t.name.toLowerCase().includes('crate'));

      if (!crateTableName) {
        console.log('No crate table found');
        return [];
      }

      const crates = db.prepare(`SELECT * FROM ${crateTableName.name}`).all();

      // Try to get tracks in each crate
      const crateTrackTable = tables.find(t =>
        t.name.toLowerCase().includes('cratetrack') ||
        t.name.toLowerCase().includes('crate_track')
      );

      if (crateTrackTable) {
        for (const crate of crates) {
          const crateId = crate.id || crate.crateId || crate.ID;
          if (crateId) {
            const trackCount = db.prepare(
              `SELECT COUNT(*) as count FROM ${crateTrackTable.name} WHERE crateId = ?`
            ).get(crateId);
            crate.track_count = trackCount.count;
          }
        }
      }

      db.close();
      return crates;
    } catch (error) {
      db.close();
      console.error('Error reading Serato crates:', error);
      return [];
    }
  }
}

module.exports = new SeratoReader();
