import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Visual Lineage Discovery
 * Maps the user's color palette to global visual movements.
 * Shows movement affinities and hex color recommendations.
 * B&W. Sharp. Same aesthetic as LineageDiscoveries.
 *
 * Likert feedback lives on the main palette swatches in NommoPanel;
 * this view is pure information, not interaction.
 */
const VisualLineageDiscovery = ({ colorPalette = [], userId = 'default_user' }) => {
  const [result, setResult] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMovement, setExpandedMovement] = useState(null);

  // Auto-discover when palette changes
  useEffect(() => {
    if (colorPalette.length > 0) {
      handleDiscover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(colorPalette)]);

  const handleDiscover = async () => {
    if (colorPalette.length === 0) return;
    setDiscovering(true);
    setError(null);
    try {
      const hexes = colorPalette.map(c => (typeof c === 'string' ? c : c.hex));
      const res = await axios.post('/api/expansion/visual-lineage', { palette: hexes, userId });
      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Visual lineage discovery failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Visual lineage discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  if (colorPalette.length === 0) {
    return null;
  }

  return (
    <div className="border border-brand-border p-6 mt-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-display-md text-brand-text">Visual Lineage</p>
          <p className="text-body text-brand-secondary mt-1">
            Your color palette mapped to global visual movements
          </p>
        </div>
        {result && (
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="text-body-sm text-brand-text underline"
          >
            {discovering ? 'Mapping...' : 'Remap'}
          </button>
        )}
      </div>

      {/* Loading */}
      {discovering && !result && (
        <p className="text-body text-brand-secondary">Mapping palette to movements...</p>
      )}

      {/* Error */}
      {error && (
        <div className="border border-brand-border p-4">
          <p className="text-body text-brand-secondary">{error}</p>
        </div>
      )}

      {/* Movement Affinities — compact 4-col grid, era folded in */}
      {result?.movements?.length > 0 && (
        <div className="mb-4">
          <p className="uppercase-label text-brand-secondary mb-3">Movement Affinities</p>
          <div className="space-y-1.5">
            {result.movements.map((m) => (
              <div key={m.id}>
                <button
                  onClick={() => setExpandedMovement(expandedMovement === m.id ? null : m.id)}
                  className="w-full text-left group"
                >
                  <div
                    className="grid items-baseline gap-3"
                    style={{ gridTemplateColumns: '1fr 120px 90px 48px' }}
                  >
                    <span className="text-body-sm text-brand-text truncate">
                      {m.name}
                      {m.boosted && (
                        <span className="text-brand-secondary opacity-60 ml-1" title="Amplified by Project DNA or high-signal photos">*</span>
                      )}
                    </span>
                    <span className="text-body-xs text-brand-secondary truncate text-right">
                      {m.region}
                    </span>
                    <span className="text-body-xs text-brand-secondary truncate text-right">
                      {m.era}
                    </span>
                    <span className="text-body-sm font-mono text-brand-text text-right">
                      {m.affinity}%
                    </span>
                  </div>
                  <div className="h-[2px] w-full bg-brand-border mt-1">
                    <div
                      className="h-full bg-brand-text transition-all duration-300"
                      style={{ width: `${m.affinity}%` }}
                    />
                  </div>
                </button>

                {/* Expanded detail */}
                {expandedMovement === m.id && (
                  <div className="mt-2 pl-3 border-l border-brand-border space-y-2 pb-2">
                    <div className="flex gap-1">
                      {m.palette.map((hex, i) => (
                        <div key={i} className="flex-1">
                          <div
                            className="h-6 border border-brand-border"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                          <p className="text-body-xs text-brand-secondary mt-0.5 text-center font-mono">
                            {hex}
                          </p>
                        </div>
                      ))}
                    </div>
                    {m.keywords?.length > 0 && (
                      <p className="text-body-xs text-brand-secondary">
                        {m.keywords.join(' / ')}
                      </p>
                    )}
                    {m.context && (
                      <p className="text-body-xs text-brand-secondary italic">
                        {m.context}
                      </p>
                    )}
                    {m.practitioners?.length > 0 && (
                      <p className="text-body-xs text-brand-secondary">
                        {m.practitioners.join(' · ')}
                      </p>
                    )}
                    <p className="text-body-xs text-brand-secondary">
                      {m.matchCount} color{m.matchCount !== 1 ? 's' : ''} matched
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hex Color Recommendations — information only, no Likert noise */}
      {result?.recommendations?.length > 0 && (
        <div className="border-t border-brand-border pt-4">
          <p className="uppercase-label text-brand-secondary mb-3">Color Recommendations</p>
          <div className="space-y-1.5">
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="grid items-center gap-3"
                style={{ gridTemplateColumns: '24px 12px 24px 1fr' }}
              >
                {/* Current swatch */}
                <div
                  className="h-6 w-6 border border-brand-border"
                  style={{ backgroundColor: rec.currentHex }}
                  title={rec.currentHex}
                />
                <span className="text-brand-secondary text-body-xs text-center">→</span>
                {/* Suggested swatch */}
                <div
                  className="h-6 w-6 border-2 border-brand-text"
                  style={{ backgroundColor: rec.suggestedHex }}
                  title={rec.suggestedHex}
                />
                {/* Single-line context */}
                <p className="text-body-xs text-brand-text truncate">
                  <span className="font-mono">{rec.suggestedHex}</span>
                  <span className="text-brand-secondary"> · {rec.movement} · {rec.region} · {rec.era}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualLineageDiscovery;
