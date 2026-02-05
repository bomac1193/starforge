import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Music Library Component
 * Displays user's complete music library with search, filter, sort
 */
const MusicLibrary = ({ userId = 'default_user', onTrackSelect }) => {
  const [library, setLibrary] = useState({ tracks: [], pagination: {} });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [search, setSearch] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);

  useEffect(() => {
    fetchLibrary();
    fetchStats();
  }, [page, sortBy, sortOrder, search]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/library', {
        params: {
          user_id: userId,
          page,
          limit: 50,
          sortBy,
          sortOrder,
          search
        }
      });

      if (response.data.success) {
        setLibrary({
          tracks: response.data.tracks,
          pagination: response.data.pagination
        });
      }
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/library/stats', {
        params: { user_id: userId }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLibrary();
  };

  const handleDelete = async (trackId) => {
    if (!window.confirm('Delete this track?')) return;

    try {
      await axios.delete(`/api/library/track/${trackId}`, {
        params: { user_id: userId }
      });
      fetchLibrary();
      fetchStats();
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !stats) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-3"></div>
        <p className="text-body-sm text-brand-secondary">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Library Stats Header */}
      {stats && (
        <div className="card">
          <h3 className="text-display-md mb-4">Music Library</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-body-xs text-brand-secondary mb-1">Total Tracks</p>
              <p className="text-display-sm text-brand-text">{stats.totalTracks}</p>
            </div>
            <div>
              <p className="text-body-xs text-brand-secondary mb-1">Avg BPM</p>
              <p className="text-display-sm text-brand-text">{stats.avgBpm?.toFixed(1) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-body-xs text-brand-secondary mb-1">Avg Energy</p>
              <p className="text-display-sm text-brand-text">{(stats.avgEnergy * 100)?.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-body-xs text-brand-secondary mb-1">Sources</p>
              <p className="text-display-sm text-brand-text">{stats.sourceCount}</p>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="flex gap-4 text-body-xs text-brand-secondary">
            {stats.sources.map((source) => (
              <span key={source.source}>
                {source.source}: {source.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Track Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-brand-border">
              <th
                className="text-left p-3 uppercase-label text-brand-secondary cursor-pointer hover:text-brand-text"
                onClick={() => handleSort('filename')}
              >
                Track {sortBy === 'filename' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th
                className="text-center p-3 uppercase-label text-brand-secondary cursor-pointer hover:text-brand-text"
                onClick={() => handleSort('bpm')}
              >
                BPM {sortBy === 'bpm' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th
                className="text-center p-3 uppercase-label text-brand-secondary cursor-pointer hover:text-brand-text"
                onClick={() => handleSort('energy')}
              >
                Energy {sortBy === 'energy' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th className="text-center p-3 uppercase-label text-brand-secondary">Key</th>
              <th className="text-center p-3 uppercase-label text-brand-secondary">Duration</th>
              <th className="text-center p-3 uppercase-label text-brand-secondary">Source</th>
              <th
                className="text-center p-3 uppercase-label text-brand-secondary cursor-pointer hover:text-brand-text"
                onClick={() => handleSort('uploaded_at')}
              >
                Added {sortBy === 'uploaded_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th className="text-center p-3 uppercase-label text-brand-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {library.tracks.map((track) => (
              <tr
                key={track.id}
                className="border-b border-brand-border hover:bg-brand-border/20 cursor-pointer"
                onClick={() => onTrackSelect && onTrackSelect(track)}
              >
                <td className="p-3 text-brand-text">
                  <div className="max-w-xs truncate">{track.filename}</div>
                  {track.rekordbox_comments && (
                    <div className="text-body-xs text-brand-secondary truncate max-w-xs">
                      {track.rekordbox_comments}
                    </div>
                  )}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {track.bpm?.toFixed(0) || '-'}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {track.energy ? (track.energy * 100).toFixed(0) + '%' : '-'}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {track.key || '-'}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {formatDuration(track.duration_seconds || 0)}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {track.source}
                </td>
                <td className="p-3 text-center text-brand-secondary">
                  {formatDate(track.uploaded_at)}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(track.id);
                    }}
                    className="text-body-xs text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {library.tracks.length === 0 && !loading && (
          <div className="p-8 text-center text-brand-secondary">
            {search ? 'No tracks found matching your search.' : 'No tracks in library yet. Upload some music!'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {library.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!library.pagination.hasPrev}
            className="btn-secondary disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-body-sm text-brand-secondary">
            Page {library.pagination.page} of {library.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!library.pagination.hasNext}
            className="btn-secondary disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicLibrary;
