import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

/**
 * Rekordbox Import Panel
 * Upload collection.xml to learn from your listening patterns
 */
const RekordboxImportPanel = ({ onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('xml', file);

      const response = await axios.post('/api/audio/rekordbox/import-xml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setImportResult(response.data.import);
        if (onImportComplete) {
          onImportComplete(response.data.import);
        }
      }
    } catch (err) {
      console.error('Rekordbox import failed:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setImporting(false);
    }
  }, [onImportComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    multiple: false,
    disabled: importing
  });

  return (
    <div className="card">
      <h3 className="text-xl mb-4">📀 Rekordbox Integration</h3>
      <p className="text-muted text-sm mb-4">
        Upload your collection.xml to learn from your star ratings, play counts, and listening patterns
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-mint bg-mint bg-opacity-10'
            : importing
            ? 'border-muted opacity-50 cursor-not-allowed'
            : 'border-muted hover:border-mint'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📊</div>
        <p className="text-text">
          {isDragActive
            ? 'Drop collection.xml here...'
            : importing
            ? 'Importing...'
            : 'Drag & drop collection.xml or click to browse'}
        </p>
        <p className="text-xs text-muted mt-2">
          In Rekordbox: File → Export Collection in xml format
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
          <p className="text-sm text-red-500">❌ {error}</p>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-mint bg-opacity-10 border border-mint rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-mint font-bold">✓ Import Complete</span>
              <span className="text-sm text-muted">
                {importResult.imported} / {importResult.totalTracks} tracks
              </span>
            </div>

            {importResult.failed > 0 && (
              <p className="text-xs text-muted mb-3">
                {importResult.failed} tracks failed to import
              </p>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-cosmic rounded-lg">
                <div className="text-xs text-muted mb-1">Total Plays</div>
                <div className="text-lg font-bold text-text">
                  {importResult.stats?.totalPlays?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-cosmic rounded-lg">
                <div className="text-xs text-muted mb-1">Avg Rating</div>
                <div className="text-lg font-bold text-text">
                  {Math.round((importResult.stats?.avgRating || 0) * 10) / 10} ⭐
                </div>
              </div>
            </div>
          </div>

          {/* Top Genres */}
          {importResult.stats?.topGenres && (
            <div className="p-4 bg-cosmic border border-muted rounded-lg">
              <div className="text-sm font-bold text-glow mb-3">Top Genres</div>
              <div className="flex flex-wrap gap-2">
                {importResult.stats.topGenres.slice(0, 8).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-glow bg-opacity-20 text-glow text-xs rounded-full"
                  >
                    {genre.genre} ({genre.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Most Played */}
          {importResult.stats?.mostPlayed && (
            <div className="p-4 bg-cosmic border border-muted rounded-lg">
              <div className="text-sm font-bold text-glow mb-3">Most Played Tracks</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importResult.stats.mostPlayed.slice(0, 10).map((track, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="truncate flex-1">
                      <span className="text-text">{track.title}</span>
                      <span className="text-muted text-xs ml-2">by {track.artist}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-mint text-xs">{track.playCount} plays</span>
                      {track.starRating > 0 && (
                        <span className="text-glow text-xs">
                          {'⭐'.repeat(track.starRating)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Taste Profile */}
          {importResult.tasteProfile && (
            <div className="p-4 bg-glow bg-opacity-10 border border-glow rounded-lg">
              <div className="text-sm font-bold text-glow mb-3">Your Taste Profile</div>

              {importResult.tasteProfile.preferredBpmRange && (
                <div className="mb-3">
                  <span className="text-xs text-muted">BPM Sweet Spot:</span>
                  <span className="ml-2 text-text font-bold">
                    {Math.round(importResult.tasteProfile.preferredBpmRange.min)} -{' '}
                    {Math.round(importResult.tasteProfile.preferredBpmRange.max)} BPM
                  </span>
                </div>
              )}

              {importResult.tasteProfile.topKeys && (
                <div className="mb-3">
                  <span className="text-xs text-muted">Favorite Keys:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {importResult.tasteProfile.topKeys.map((k, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cosmic text-xs rounded">
                        {k.key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {importResult.tasteProfile.preferences && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted">Energy:</span>
                    <span className="ml-2 text-mint font-bold">
                      {Math.round(importResult.tasteProfile.preferences.highEnergyPreference * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Diversity:</span>
                    <span className="ml-2 text-mint font-bold">
                      {Math.round(importResult.tasteProfile.preferences.diversityScore * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!importResult && (
        <div className="mt-4 p-3 bg-cosmic border border-muted rounded-lg">
          <p className="text-xs text-muted">
            <strong>How to export from Rekordbox:</strong>
          </p>
          <ol className="text-xs text-muted mt-2 ml-4 space-y-1 list-decimal">
            <li>Open Rekordbox on your computer</li>
            <li>Click "Collection" in the left sidebar (not a playlist)</li>
            <li>Go to File → Export Collection in xml format</li>
            <li>Save the collection.xml file</li>
            <li>Upload it here</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default RekordboxImportPanel;
