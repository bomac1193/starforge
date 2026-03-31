import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LIKERT_LABELS = [
  { value: 1, label: 'Miss' },
  { value: 2, label: 'Noted' },
  { value: 3, label: 'Resonant' },
  { value: 4, label: 'Canon' },
  { value: 5, label: 'Ancestor' },
];

/**
 * Lineage Discoveries
 * Cultural artifacts that fill gaps in your creative genealogy.
 * B&W. Sharp. Likert-rated. Wall-ready.
 */
const LineageDiscoveries = ({ userId = 'default', projectDnaData }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [lineageMap, setLineageMap] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});
  const [wallView, setWallView] = useState(false);
  const [savedArtifacts, setSavedArtifacts] = useState([]);

  // Load cached suggestions + saved ratings on mount
  useEffect(() => {
    loadCached();
    loadSaved();
  }, [userId]);

  const loadCached = async () => {
    try {
      const res = await axios.get(`/api/expansion/suggestions/${userId}`);
      if (res.data.success && res.data.suggestions) {
        setSuggestions(res.data.suggestions);
        setLineageMap(res.data.lineage_map || null);
      }
    } catch {
      // No cached results
    }
  };

  const loadSaved = async () => {
    try {
      const res = await axios.get(`/api/expansion/saved/${userId}`);
      if (res.data.success) {
        setSavedArtifacts(res.data.saved || []);
        // Populate ratings map
        const rMap = {};
        (res.data.saved || []).forEach(s => {
          const key = `${s.artifact}::${s.year || ''}`.toLowerCase().trim();
          rMap[key] = s.rating;
        });
        setRatings(rMap);
      }
    } catch {
      // No saved artifacts
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const res = await axios.post('/api/expansion/discover', { userId });
      if (res.data.success) {
        setSuggestions(res.data.suggestions || []);
        setLineageMap(res.data.lineage_map || null);
      } else {
        setError(res.data.error || 'Discovery failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleRate = async (artifact, rating) => {
    const key = `${artifact.artifact}::${artifact.year || ''}`.toLowerCase().trim();
    const currentRating = ratings[key];

    // Toggle off if same rating clicked
    if (currentRating === rating) {
      try {
        await axios.delete('/api/expansion/rate', {
          data: { userId, artifactKey: key },
        });
        setRatings(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setSavedArtifacts(prev => prev.filter(s => s.artifactKey !== key));
      } catch {
        // Silent fail
      }
      return;
    }

    try {
      await axios.post('/api/expansion/rate', {
        userId,
        artifact,
        rating,
      });
      setRatings(prev => ({ ...prev, [key]: rating }));
      loadSaved();
    } catch {
      // Silent fail
    }
  };

  const getArtifactKey = (s) =>
    `${s.artifact}::${s.year || ''}`.toLowerCase().trim();

  // Wall view: only rated artifacts, clean layout
  if (wallView) {
    const rated = savedArtifacts.filter(s => s.rating >= 3);
    return (
      <div className="border border-brand-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="uppercase-label text-brand-text">Lineage Wall</p>
            <p className="text-body-sm text-brand-secondary mt-1">
              {rated.length} artifacts rated resonant or higher
            </p>
          </div>
          <button
            onClick={() => setWallView(false)}
            className="text-body-sm text-brand-secondary hover:text-brand-text transition-colors"
          >
            Back
          </button>
        </div>

        {rated.length === 0 ? (
          <p className="text-body-sm text-brand-secondary">
            Rate discoveries 3+ to add them to your wall.
          </p>
        ) : (
          <div className="space-y-4">
            {rated.map((s, idx) => (
              <div key={idx} className="border-b border-brand-border pb-4 last:border-b-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-body text-brand-text font-medium">{s.artifact}</p>
                  <span className="text-body-sm font-mono text-brand-text ml-3">
                    {Math.round((s.conviction || 0) * 100)}%
                  </span>
                </div>
                <p className="text-body-sm text-brand-secondary mt-1">
                  {s.year} / {s.location} / {s.medium}
                </p>
                <p className="text-body-sm text-brand-text mt-2">{s.connection}</p>
                <div className="flex items-center gap-1 mt-3">
                  {LIKERT_LABELS.map((l) => (
                    <div
                      key={l.value}
                      className={`h-2 flex-1 ${
                        l.value <= s.rating ? 'bg-brand-text' : 'bg-brand-border'
                      }`}
                    />
                  ))}
                  <span className="text-body-xs text-brand-secondary ml-2">
                    {LIKERT_LABELS.find(l => l.value === s.rating)?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback summary */}
        {rated.length > 0 && (
          <div className="mt-6 pt-4 border-t border-brand-border">
            <p className="uppercase-label text-brand-secondary mb-3">What You Learned</p>
            <div className="grid grid-cols-3 gap-4 text-body-xs">
              <div>
                <p className="text-brand-text font-medium">{rated.filter(s => s.rating === 5).length}</p>
                <p className="text-brand-secondary">Ancestors</p>
              </div>
              <div>
                <p className="text-brand-text font-medium">{rated.filter(s => s.rating === 4).length}</p>
                <p className="text-brand-secondary">Canon</p>
              </div>
              <div>
                <p className="text-brand-text font-medium">{rated.filter(s => s.rating === 3).length}</p>
                <p className="text-brand-secondary">Resonant</p>
              </div>
            </div>
            <div className="mt-3 text-body-xs text-brand-secondary">
              <p>
                {savedArtifacts.length} total rated / {savedArtifacts.filter(s => s.rating <= 2).length} misses or noted
              </p>
              <p className="mt-1">
                System accuracy: {rated.length > 0 ? Math.round((rated.length / savedArtifacts.length) * 100) : 0}% resonance rate
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-brand-border p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-display-md text-brand-text">Lineage Discoveries</p>
          <p className="text-body text-brand-secondary mt-1">
            Cultural artifacts that fill gaps in your creative genealogy
          </p>
        </div>
        {savedArtifacts.length > 0 && (
          <button
            onClick={() => setWallView(true)}
            className="text-body-sm text-brand-text border border-brand-border px-3 py-1 hover:bg-brand-border transition-colors"
          >
            Wall
          </button>
        )}
      </div>

      {/* Discover button */}
      {!suggestions && (
        <button
          onClick={handleDiscover}
          disabled={discovering || !projectDnaData}
          className="btn-primary w-full"
        >
          {discovering
            ? 'Researching lineage...'
            : !projectDnaData
            ? 'Scan Project DNA first'
            : 'Discover Lineage'}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="border border-brand-border p-4 mt-4">
          <p className="text-body text-brand-secondary">{error}</p>
        </div>
      )}

      {/* Lineage Map */}
      {lineageMap && (
        <div className="border border-brand-border p-4 mb-4">
          <p className="uppercase-label text-brand-secondary mb-2">Lineage Thread</p>
          <p className="text-body text-brand-text mb-3">
            {lineageMap.primary_thread}
          </p>
          {lineageMap.branches?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lineageMap.branches.map((branch, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 border border-brand-border text-body-sm text-brand-secondary"
                >
                  {branch}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="uppercase-label text-brand-secondary">
              {suggestions.length} discoveries
            </p>
            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="text-body-sm text-brand-text underline"
            >
              {discovering ? 'Researching...' : 'Rediscover'}
            </button>
          </div>

          {[...suggestions].sort((a, b) => (b.conviction || 0) - (a.conviction || 0)).map((s, idx) => {
            const key = getArtifactKey(s);
            const currentRating = ratings[key] || 0;

            return (
              <div
                key={idx}
                className="border border-brand-border p-4 space-y-3"
              >
                {/* Artifact header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-body text-brand-text font-medium">
                      {s.artifact}
                    </p>
                    <p className="text-body-sm text-brand-secondary mt-1">
                      {s.year} / {s.location} / {s.medium}
                    </p>
                  </div>
                  <span className="ml-3 text-body-sm font-mono text-brand-text">
                    {Math.round((s.conviction || 0) * 100)}%
                  </span>
                </div>

                {/* Connection */}
                <p className="text-body-sm text-brand-text">
                  {s.connection}
                </p>

                {/* Gap filled */}
                <p className="text-body-sm text-brand-secondary">
                  Gap: {s.gap_filled}
                </p>

                {/* Deep context (collapsible) */}
                {s.deep_context && (
                  <details className="text-body-sm text-brand-secondary">
                    <summary className="cursor-pointer hover:text-brand-text transition-colors">
                      Context
                    </summary>
                    <p className="mt-2 pl-3 border-l border-brand-border">
                      {s.deep_context}
                    </p>
                  </details>
                )}

                {/* Likert Rating */}
                <div className="pt-2 border-t border-brand-border">
                  <div className="flex items-center gap-1">
                    {LIKERT_LABELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => handleRate(s, l.value)}
                        className="flex-1 group relative"
                        title={l.label}
                      >
                        <div
                          className={`h-3 w-full transition-colors ${
                            l.value <= currentRating
                              ? 'bg-brand-text'
                              : 'bg-brand-border hover:bg-brand-secondary'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-body-xs text-brand-secondary ml-2 min-w-[60px]">
                      {currentRating > 0
                        ? LIKERT_LABELS.find(l => l.value === currentRating)?.label
                        : 'Rate'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Missing regions */}
      {lineageMap?.missing_regions?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-border">
          <p className="uppercase-label text-brand-secondary mb-2">Unexplored Regions</p>
          <p className="text-body-sm text-brand-secondary">
            {lineageMap.missing_regions.join(' / ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LineageDiscoveries;
