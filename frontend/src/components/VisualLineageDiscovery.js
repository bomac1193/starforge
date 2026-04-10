import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Visual Lineage Discovery
 * Maps the user's color palette to global visual movements.
 * Shows visual era, movement affinities, and hex color recommendations.
 * B&W. Sharp. Same aesthetic as LineageDiscoveries.
 */
const VisualLineageDiscovery = ({ colorPalette = [], userId = 'default_user' }) => {
  const [result, setResult] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMovement, setExpandedMovement] = useState(null);
  const [recRatings, setRecRatings] = useState({}); // hex -> 1..5

  // Load existing ratings for suggested colors
  const fetchRatings = useCallback(async () => {
    try {
      const res = await axios.get(`/api/color-ratings/${userId}`);
      if (res.data?.success) {
        const map = {};
        for (const r of res.data.ratings || []) {
          map[r.color_hex] = r.rating;
        }
        setRecRatings(map);
      }
    } catch (e) {
      // silent — ratings are optional
    }
  }, [userId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handleRateRec = async (rec, rating) => {
    const hex = rec.suggestedHex;
    const current = recRatings[hex] || 0;
    try {
      if (current === rating) {
        // toggle off
        await axios.delete('/api/color-ratings/rate', {
          data: { userId, colorHex: hex },
        });
        setRecRatings((prev) => {
          const { [hex]: _, ...rest } = prev;
          return rest;
        });
      } else {
        await axios.post('/api/color-ratings/rate', {
          userId,
          color: {
            hex,
            culturalName: rec.movement,
            origin: `${rec.region} / ${rec.era}`,
          },
          rating,
        });
        setRecRatings((prev) => ({ ...prev, [hex]: rating }));
      }
    } catch (e) {
      console.error('Failed to rate recommendation:', e);
    }
  };

  // Auto-discover when palette changes
  useEffect(() => {
    if (colorPalette.length > 0) {
      handleDiscover();
    }
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

      {/* Visual Era — compact */}
      {result?.visualEra && (
        <div className="border border-brand-border p-4 mb-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="uppercase-label text-brand-secondary">Visual Era</p>
            <span className="text-body-sm font-mono text-brand-text">
              {Math.round(result.visualEra.affinity * 100)}%
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-1">
            <p className="text-body text-brand-text font-medium">
              {result.visualEra.movement}
            </p>
            <p className="text-body-xs text-brand-secondary">
              {result.visualEra.region} · {result.visualEra.era}
            </p>
          </div>
          <p className="text-body-sm text-brand-text mt-2">
            {result.visualEra.context}
          </p>
          {result.visualEra.practitioners?.length > 0 && (
            <p className="text-body-xs text-brand-secondary mt-2">
              {result.visualEra.practitioners.join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Movement Affinities — compact grid layout */}
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

      {/* Hex Color Recommendations — compact grid with Likert feedback */}
      {result?.recommendations?.length > 0 && (
        <div className="border-t border-brand-border pt-4 mb-4">
          <div className="flex items-baseline justify-between mb-3">
            <p className="uppercase-label text-brand-secondary">Color Recommendations</p>
            <p className="text-body-xs text-brand-secondary">Rate to save · 4+ enters My Palette</p>
          </div>
          <div className="space-y-2">
            {result.recommendations.map((rec, idx) => {
              const hex = rec.suggestedHex;
              const currentRating = recRatings[hex] || 0;
              const ratingLabels = ['Miss', 'Noted', 'Resonant', 'Canon', 'Ancestor'];
              return (
                <div
                  key={idx}
                  className="grid items-center gap-3 py-1.5"
                  style={{ gridTemplateColumns: '28px 14px 28px 1fr 96px' }}
                >
                  {/* Current swatch */}
                  <div
                    className="h-7 w-7 border border-brand-border"
                    style={{ backgroundColor: rec.currentHex }}
                    title={rec.currentHex}
                  />
                  {/* Arrow */}
                  <span className="text-brand-secondary text-body-xs text-center">→</span>
                  {/* Suggested swatch */}
                  <div
                    className="h-7 w-7 border-2 border-brand-text"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  {/* Compact context (2 lines max, monospace hex) */}
                  <div className="min-w-0">
                    <p className="text-body-sm text-brand-text truncate">
                      <span className="font-mono">{hex}</span>
                      <span className="text-brand-secondary"> · {rec.movement}</span>
                    </p>
                    <p className="text-body-xs text-brand-secondary truncate">
                      {rec.region} · {rec.era} · {rec.practitioner}
                    </p>
                  </div>
                  {/* Likert bars */}
                  <div className="flex items-center gap-px">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleRateRec(rec, val)}
                        className="flex-1"
                        title={ratingLabels[val - 1]}
                      >
                        <div
                          className={`h-2 w-full transition-colors ${
                            val <= currentRating
                              ? 'bg-brand-text'
                              : 'bg-brand-border hover:bg-brand-secondary'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lineage Map — compact */}
      {result?.lineage && (
        <div className="border-t border-brand-border pt-4">
          <p className="uppercase-label text-brand-secondary mb-2">Visual Lineage</p>
          <div className="space-y-1">
            {result.lineage.primary && (
              <p className="text-body-sm text-brand-text">
                <span className="text-brand-secondary uppercase-label mr-2">Primary</span>
                {result.lineage.primary}
              </p>
            )}
            {result.lineage.secondary && (
              <p className="text-body-sm text-brand-text">
                <span className="text-brand-secondary uppercase-label mr-2">Secondary</span>
                {result.lineage.secondary}
              </p>
            )}
            {result.lineage.adjacent?.length > 0 && (
              <p className="text-body-sm text-brand-text">
                <span className="text-brand-secondary uppercase-label mr-2">Adjacent</span>
                {result.lineage.adjacent.join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualLineageDiscovery;
