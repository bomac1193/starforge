import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Audio DNA Panel
 * Displays Sonic Palette - the audio equivalent of Visual DNA color palette
 * Shows frequency bands, tonal characteristics, and sonic signature
 */
const AudioDNAPanel = ({ embedded = false, audioData, rekordboxData, tizitaData }) => {
  const [sonicPalette, setSonicPalette] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [context, setContext] = useState('combined'); // 'combined', 'dj_collection', 'my_music'

  useEffect(() => {
    fetchSonicPalette();
  }, [context]);

  const fetchSonicPalette = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/deep/audio/sonic-palette', {
        params: { context }
      });

      if (response.data.success) {
        setSonicPalette(response.data.sonicPalette);
      }
    } catch (err) {
      console.error('Failed to fetch sonic palette:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSonicPalette = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/deep/audio/sonic-palette/refresh', {
        context
      });

      if (response.data.success) {
        setSonicPalette(response.data.sonicPalette);
      }
    } catch (err) {
      console.error('Failed to refresh sonic palette:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Don't show panel if no audio data available
  if (!audioData && !rekordboxData) {
    return null;
  }

  if (loading && !sonicPalette) {
    return (
      <div className="mt-6 border border-brand-border p-6 text-center">
        <p className="text-brand-secondary">Analyzing sonic palette...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 border border-brand-border p-6">
        <p className="uppercase-label text-brand-secondary mb-3">Audio DNA</p>
        <p className="text-body-sm text-brand-secondary">{error}</p>
        <button
          onClick={fetchSonicPalette}
          className="mt-4 btn-secondary w-full"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sonicPalette) {
    return null;
  }

  // B&W prominence — no color, sharp restraint
  const getProminenceColor = () => 'bg-white';

  return (
    <div className={embedded ? '' : 'mt-6 border border-brand-border p-6'}>
      {!embedded && (
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="uppercase-label text-brand-text mb-1">Audio DNA</p>
            <p className="text-body-sm text-brand-secondary">
              Sonic palette extracted from {sonicPalette.trackCount} tracks
            </p>
          </div>
          <button
            onClick={refreshSonicPalette}
            disabled={loading}
            className="text-body-sm text-brand-secondary hover:text-brand-text transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Context Filter */}
      {rekordboxData && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setContext('combined')}
            className={`px-3 py-1 text-body-sm border ${
              context === 'combined'
                ? 'border-brand-text text-brand-text bg-brand-border'
                : 'border-brand-border text-brand-secondary'
            }`}
          >
            All Music
          </button>
          <button
            onClick={() => setContext('dj_collection')}
            className={`px-3 py-1 text-body-sm border ${
              context === 'dj_collection'
                ? 'border-brand-text text-brand-text bg-brand-border'
                : 'border-brand-border text-brand-secondary'
            }`}
          >
            DJ Collection
          </button>
          <button
            onClick={() => setContext('my_music')}
            className={`px-3 py-1 text-body-sm border ${
              context === 'my_music'
                ? 'border-brand-text text-brand-text bg-brand-border'
                : 'border-brand-border text-brand-secondary'
            }`}
          >
            Personal Music
          </button>
        </div>
      )}

      {/* Style Description */}
      {sonicPalette.styleDescription && (
        <div className="mb-6">
          <p className="text-body text-brand-text">
            {sonicPalette.styleDescription}
          </p>
          {sonicPalette.tonalCharacteristics && (
            <p className="text-body-sm text-brand-secondary mt-2">
              {sonicPalette.tonalCharacteristics}
            </p>
          )}
        </div>
      )}

      {/* Sonic Palette (Frequency Bars) — B&W, sharp edges, consistent */}
      {sonicPalette.sonicPalette && sonicPalette.sonicPalette.length > 0 && (
        <div className="mb-6">
          <p className="uppercase-label text-brand-secondary mb-3">Sonic Palette</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sonicPalette.sonicPalette.map((band, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 36px', alignItems: 'center', gap: '8px' }}>
                <div style={{ overflow: 'hidden' }}>
                  <span className="text-brand-text capitalize" style={{ fontSize: '11px', fontWeight: 500, display: 'block', lineHeight: 1.2 }}>
                    {band.band.replace('_', ' ')}
                  </span>
                  <span className="text-brand-secondary" style={{ fontSize: '9px' }}>
                    {band.frequency_range}
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--brand-border, #333)' }}>
                  <div
                    className={getProminenceColor()}
                    style={{ height: '100%', width: `${band.prominence * 100}%`, transition: 'width 0.3s' }}
                  />
                </div>
                <span className="text-brand-text font-mono" style={{ fontSize: '10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(band.prominence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dominant Frequencies — compact pills */}
      {sonicPalette.dominantFrequencies && sonicPalette.dominantFrequencies.length > 0 && (
        <div style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid var(--brand-border, #333)' }}>
          <p className="uppercase-label text-brand-secondary" style={{ marginBottom: '8px' }}>Dominant Frequencies</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {sonicPalette.dominantFrequencies.map((freq, idx) => (
              <div
                key={idx}
                style={{ flex: 1, border: '1px solid var(--brand-border, #333)', padding: '8px 6px', textAlign: 'center' }}
              >
                <p className="text-brand-text capitalize" style={{ fontSize: '11px', fontWeight: 500, marginBottom: '2px' }}>
                  {freq.band.replace('_', ' ')}
                </p>
                <p className="text-brand-secondary font-mono" style={{ fontSize: '10px', fontVariantNumeric: 'tabular-nums' }}>
                  {freq.prominence}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Stats — minimal footer */}
      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--brand-border, #333)', fontSize: '10px', color: 'var(--brand-secondary, #888)' }}>
        {sonicPalette.totalAnalyzed} tracks · {sonicPalette.highQualityCount} high-energy · {Math.round((sonicPalette.confidence || 0) * 100)}% confidence
        {sonicPalette.cached && <span style={{ fontStyle: 'italic' }}> · cached</span>}
      </div>
    </div>
  );
};

export default AudioDNAPanel;
