import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Audio DNA Panel
 * Displays sonic palette, taste coherence, and cross-modal alignment
 * Aesthetic: Minimal, chic, editorial (matches Visual DNA styling)
 */
const AudioDNAPanel = ({ audioData, rekordboxData, clarosaData }) => {
  const [sonicPalette, setSonicPalette] = useState(null);
  const [tasteCoherence, setTasteCoherence] = useState(null);
  const [crossModalCoherence, setCrossModalCoherence] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (audioData || rekordboxData) {
      loadAudioDNA();
    }
  }, [audioData, rekordboxData]);

  useEffect(() => {
    if ((audioData || rekordboxData) && clarosaData) {
      loadCrossModalCoherence();
    }
  }, [audioData, rekordboxData, clarosaData]);

  const loadAudioDNA = async () => {
    setLoading(true);
    try {
      // Fetch sonic palette
      const paletteRes = await axios.get('/api/deep/audio/sonic-palette');
      if (paletteRes.data.success) {
        setSonicPalette(paletteRes.data.sonicPalette);
      }

      // Fetch taste coherence
      const coherenceRes = await axios.get('/api/deep/audio/taste-coherence');
      if (coherenceRes.data.success) {
        setTasteCoherence(coherenceRes.data.coherence);
      }
    } catch (error) {
      console.error('Failed to load audio DNA:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCrossModalCoherence = async () => {
    try {
      const response = await axios.post('/api/deep/cross-modal/analyze', {
        userId: 1
      });

      if (response.data.success) {
        setCrossModalCoherence(response.data.coherence);
      }
    } catch (error) {
      console.error('Failed to load cross-modal coherence:', error);
    }
  };

  if (!audioData && !rekordboxData) {
    return null;
  }

  return (
    <div className="mt-6 border border-brand-border p-4">
      <p className="uppercase-label text-brand-secondary mb-4">Audio DNA</p>

      {/* Sonic Palette */}
      {sonicPalette && (
        <div className="mb-4">
          <p className="uppercase-label text-brand-secondary mb-2">Sonic Palette</p>

          {/* Tonal Description */}
          <p className="text-body text-brand-text mb-3">
            {sonicPalette.tonalCharacteristics}
          </p>

          {/* Frequency Bars */}
          {sonicPalette.sonicPalette && sonicPalette.sonicPalette.length > 0 && (
            <div className="space-y-2">
              {sonicPalette.sonicPalette.map((band, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body-sm text-brand-secondary">
                      {band.bandLabel}
                    </span>
                    <span className="text-body-sm text-brand-text">
                      {Math.round(band.prominence * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-brand-border">
                    <div
                      className="h-full bg-brand-text"
                      style={{ width: `${band.prominence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="text-body-sm text-brand-secondary mt-3">
            {sonicPalette.totalAnalyzed} tracks analyzed •{' '}
            {sonicPalette.highQualityCount} high quality •{' '}
            {Math.round(sonicPalette.confidence * 100)}% confidence
            {sonicPalette.cached && (
              <span> • cached {sonicPalette.cacheAge}m ago</span>
            )}
          </div>
        </div>
      )}

      {/* Taste Coherence */}
      {tasteCoherence && (
        <div className="mb-4 pt-4 border-t border-brand-border">
          <p className="uppercase-label text-brand-secondary mb-3">Taste Coherence</p>

          {/* Overall Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-body text-brand-text">Overall</span>
              <span className="text-body font-medium text-brand-text">
                {Math.round(tasteCoherence.overall * 100)}%
              </span>
            </div>
            <div className="h-2 bg-brand-border">
              <div
                className="h-full bg-brand-text"
                style={{ width: `${tasteCoherence.overall * 100}%` }}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div>
              <span className="text-brand-secondary">BPM:</span>
              <span className="ml-2 text-brand-text font-medium">
                {Math.round(tasteCoherence.bpmConsistency * 100)}%
              </span>
            </div>
            <div>
              <span className="text-brand-secondary">Energy:</span>
              <span className="ml-2 text-brand-text font-medium">
                {Math.round(tasteCoherence.energyConsistency * 100)}%
              </span>
            </div>
            <div>
              <span className="text-brand-secondary">Genre:</span>
              <span className="ml-2 text-brand-text font-medium">
                {Math.round(tasteCoherence.genreCoherence * 100)}%
              </span>
            </div>
            <div>
              <span className="text-brand-secondary">Key:</span>
              <span className="ml-2 text-brand-text font-medium">
                {Math.round(tasteCoherence.keyCoherence * 100)}%
              </span>
            </div>
            <div>
              <span className="text-brand-secondary">Mood:</span>
              <span className="ml-2 text-brand-text font-medium">
                {Math.round(tasteCoherence.moodCoherence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Modal Alignment */}
      {crossModalCoherence && clarosaData && (
        <div className="mb-4 pt-4 border-t border-brand-border">
          <p className="uppercase-label text-brand-secondary mb-3">Cross-Modal Alignment</p>

          {/* Overall Alignment */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-body text-brand-text">Overall Alignment</span>
              <span className="text-body font-medium text-brand-text">
                {Math.round(crossModalCoherence.overall * 100)}%
              </span>
            </div>
            <div className="h-2 bg-brand-border">
              <div
                className="h-full bg-brand-text"
                style={{ width: `${crossModalCoherence.overall * 100}%` }}
              />
            </div>
          </div>

          {/* Interpretation */}
          <p className="text-body-sm text-brand-secondary mb-3">
            {crossModalCoherence.details?.interpretation}
          </p>

          {/* Alignment Metrics */}
          <div className="space-y-2 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-brand-secondary">Audio-Visual Match:</span>
              <span className="text-brand-text">
                {Math.round(crossModalCoherence.audioVisualMatch * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-secondary">Energy Alignment:</span>
              <span className="text-brand-text">
                {Math.round(crossModalCoherence.energyAlignment * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-secondary">Diversity Alignment:</span>
              <span className="text-brand-text">
                {Math.round(crossModalCoherence.diversityAlignment * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Future Features (Placeholders) */}
      <div className="mt-4 pt-4 border-t border-brand-border">
        <p className="text-body-sm text-brand-secondary mb-3">Coming Soon</p>
        <div className="space-y-2">
          <button
            className="btn-secondary w-full opacity-50 text-left px-3 py-2"
            disabled
            title="Detect emerging sounds before mainstream adoption"
          >
            <span className="block text-body-sm font-medium">Cultural Moment Detection</span>
            <span className="block text-body-sm text-brand-secondary mt-1">
              Track emerging trends in your catalog
            </span>
          </button>

          <button
            className="btn-secondary w-full opacity-50 text-left px-3 py-2"
            disabled
            title="Map genre lineages and sonic influences"
          >
            <span className="block text-body-sm font-medium">Influence Genealogy Map</span>
            <span className="block text-body-sm text-brand-secondary mt-1">
              Visualize sonic influence trees
            </span>
          </button>

          <button
            className="btn-secondary w-full opacity-50 text-left px-3 py-2"
            disabled
            title="Statistical uniqueness vs. genre norms"
          >
            <span className="block text-body-sm font-medium">Rarity Analysis</span>
            <span className="block text-body-sm text-brand-secondary mt-1">
              Measure catalog uniqueness
            </span>
          </button>

          <button
            className="btn-secondary w-full opacity-50 text-left px-3 py-2"
            disabled
            title="Subculture and scene context mapping"
          >
            <span className="block text-body-sm font-medium">Scene Mapping</span>
            <span className="block text-body-sm text-brand-secondary mt-1">
              Geographic and cultural context
            </span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <p className="text-body-sm text-brand-secondary">Loading Audio DNA...</p>
        </div>
      )}
    </div>
  );
};

export default AudioDNAPanel;
