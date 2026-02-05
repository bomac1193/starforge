import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Audio DNA Panel with Context Selection
 * Displays sonic palette, taste coherence, and cross-modal alignment
 * NEW: Context-aware analysis (DJ Collection vs My Music)
 * Aesthetic: Minimal, chic, editorial (matches Visual DNA styling)
 */
const AudioDNAPanel = ({ audioData, rekordboxData, clarosaData }) => {
  const [context, setContext] = useState('combined');
  const [sonicPalette, setSonicPalette] = useState(null);
  const [tasteCoherence, setTasteCoherence] = useState(null);
  const [crossModalCoherence, setCrossModalCoherence] = useState(null);
  const [contextComparison, setContextComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (audioData || rekordboxData) {
      if (context === 'compare') {
        loadContextComparison();
      } else {
        loadAudioDNA(context);
      }
    }
  }, [audioData, rekordboxData, context]);

  useEffect(() => {
    if ((audioData || rekordboxData) && clarosaData && context !== 'compare') {
      loadCrossModalCoherence();
    }
  }, [audioData, rekordboxData, clarosaData, context]);

  const loadAudioDNA = async (selectedContext) => {
    setLoading(true);
    try {
      // Fetch sonic palette with context
      const paletteRes = await axios.get(`/api/deep/audio/sonic-palette?context=${selectedContext}`);
      if (paletteRes.data.success) {
        setSonicPalette(paletteRes.data.sonicPalette);
      }

      // Fetch taste coherence with context
      const coherenceRes = await axios.get(`/api/deep/audio/taste-coherence?context=${selectedContext}`);
      if (coherenceRes.data.success) {
        setTasteCoherence(coherenceRes.data.coherence);
      }
    } catch (error) {
      console.error('Failed to load audio DNA:', error);
      // Clear data if context has no tracks
      if (error.response?.status === 404) {
        setSonicPalette(null);
        setTasteCoherence(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadContextComparison = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/deep/audio/context-comparison');

      if (response.data.success && response.data.comparison.available) {
        setContextComparison(response.data.comparison);
      } else {
        setContextComparison({ available: false, message: response.data.message });
      }
    } catch (error) {
      console.error('Failed to load context comparison:', error);
      setContextComparison({ available: false, message: 'Unable to compare contexts' });
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

  const getContextLabel = () => {
    switch (context) {
      case 'dj_collection':
        return 'DJ Taste';
      case 'my_music':
        return 'My Music';
      case 'combined':
        return 'Combined';
      case 'compare':
        return 'Context Comparison';
      default:
        return 'Audio DNA';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'dj_collection':
        return 'Your curatorial taste - tracks you play/mix';
      case 'my_music':
        return 'Your creative output - tracks you produce';
      case 'combined':
        return 'Full aesthetic profile across all tracks';
      case 'compare':
        return 'Compare your DJ taste vs production style';
      default:
        return '';
    }
  };

  return (
    <div className="mt-6 border border-brand-border p-4">
      <div className="mb-4">
        <p className="uppercase-label text-brand-secondary mb-2">Audio DNA</p>

        {/* Context Selector */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setContext('dj_collection')}
            className={`px-3 py-1 text-body-sm border transition-colors ${
              context === 'dj_collection'
                ? 'border-brand-text bg-brand-text text-white'
                : 'border-brand-border text-brand-secondary hover:text-brand-text hover:border-brand-text'
            }`}
          >
            DJ Taste
          </button>
          <button
            onClick={() => setContext('my_music')}
            className={`px-3 py-1 text-body-sm border transition-colors ${
              context === 'my_music'
                ? 'border-brand-text bg-brand-text text-white'
                : 'border-brand-border text-brand-secondary hover:text-brand-text hover:border-brand-text'
            }`}
          >
            My Music
          </button>
          <button
            onClick={() => setContext('combined')}
            className={`px-3 py-1 text-body-sm border transition-colors ${
              context === 'combined'
                ? 'border-brand-text bg-brand-text text-white'
                : 'border-brand-border text-brand-secondary hover:text-brand-text hover:border-brand-text'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setContext('compare')}
            className={`px-3 py-1 text-body-sm border transition-colors ${
              context === 'compare'
                ? 'border-brand-text bg-brand-text text-white'
                : 'border-brand-border text-brand-secondary hover:text-brand-text hover:border-brand-text'
            }`}
          >
            Compare
          </button>
        </div>

        {/* Context Description */}
        <p className="text-body-sm text-brand-secondary">
          {getContextDescription()}
        </p>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <p className="text-body-sm text-brand-secondary">Loading...</p>
        </div>
      )}

      {/* Comparison View */}
      {context === 'compare' && !loading && contextComparison && (
        <div>
          {!contextComparison.available ? (
            <div className="p-4 border border-brand-border">
              <p className="text-body text-brand-secondary">
                {contextComparison.message}
              </p>
            </div>
          ) : (
            <>
              {/* Overall Comparison Score */}
              <div className="mb-4 p-4 border border-brand-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body text-brand-text">Overall Alignment</span>
                  <span className="text-display-md text-brand-text">
                    {contextComparison.overall}%
                  </span>
                </div>
                <div className="h-3 bg-brand-border">
                  <div
                    className="h-full bg-brand-text transition-all"
                    style={{ width: `${contextComparison.overall}%` }}
                  />
                </div>
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 border border-brand-border">
                  <p className="text-body-sm text-brand-secondary mb-1">Sonic Alignment</p>
                  <p className="text-display-sm text-brand-text">{contextComparison.sonicAlignment}%</p>
                </div>
                <div className="p-3 border border-brand-border">
                  <p className="text-body-sm text-brand-secondary mb-1">BPM Overlap</p>
                  <p className="text-display-sm text-brand-text">{contextComparison.bpmOverlap}%</p>
                </div>
                <div className="p-3 border border-brand-border">
                  <p className="text-body-sm text-brand-secondary mb-1">Energy Alignment</p>
                  <p className="text-display-sm text-brand-text">{contextComparison.energyAlignment}%</p>
                </div>
                <div className="p-3 border border-brand-border">
                  <p className="text-body-sm text-brand-secondary mb-1">Key Alignment</p>
                  <p className="text-display-sm text-brand-text">{contextComparison.keyAlignment}%</p>
                </div>
              </div>

              {/* Context Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 border border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">DJ Collection</p>
                  <p className="text-body-sm text-brand-text mb-1">
                    {contextComparison.djContext.trackCount} tracks
                  </p>
                  <p className="text-body-sm text-brand-secondary">
                    {Math.round(contextComparison.djContext.coherence.overall * 100)}% coherent
                  </p>
                </div>
                <div className="p-3 border border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">My Music</p>
                  <p className="text-body-sm text-brand-text mb-1">
                    {contextComparison.myMusicContext.trackCount} tracks
                  </p>
                  <p className="text-body-sm text-brand-secondary">
                    {Math.round(contextComparison.myMusicContext.coherence.overall * 100)}% coherent
                  </p>
                </div>
              </div>

              {/* Insights */}
              {contextComparison.insights && contextComparison.insights.length > 0 && (
                <div className="p-4 border border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-3">Insights</p>
                  <div className="space-y-2">
                    {contextComparison.insights.map((insight, idx) => (
                      <p key={idx} className="text-body-sm text-brand-text">
                        • {insight}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Standard Analysis View (not comparison) */}
      {context !== 'compare' && !loading && (
        <>
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
              {crossModalCoherence.details?.interpretation && (
                <p className="text-body-sm text-brand-secondary mb-3">
                  {crossModalCoherence.details.interpretation}
                </p>
              )}

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
        </>
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
    </div>
  );
};

export default AudioDNAPanel;
