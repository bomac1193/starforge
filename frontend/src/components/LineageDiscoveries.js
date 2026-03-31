import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Lineage Discoveries — Expansion Engine UI
 * Shows cultural artifact suggestions that fill gaps in the user's creative lineage
 */
const LineageDiscoveries = ({ userId = 'default', projectDnaData }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [lineageMap, setLineageMap] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);

  // Load cached suggestions on mount
  useEffect(() => {
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
    loadCached();
  }, [userId]);

  const fetchCached = async () => {
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

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);

    try {
      const res = await axios.post('/api/expansion/discover', {
        userId,
      });

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

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-display-md mb-2">Lineage Discoveries</h3>
        <p className="text-body text-brand-secondary">
          Cultural artifacts that fill gaps in your creative genealogy
        </p>
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

          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="border border-brand-border p-4 space-y-2"
            >
              {/* Artifact header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-body text-brand-text font-medium">
                    {s.artifact}
                  </p>
                  <p className="text-body-sm text-brand-secondary">
                    {s.year} • {s.location} • {s.medium}
                  </p>
                </div>
                <span className="ml-3 text-body-sm font-mono text-brand-secondary">
                  {Math.round((s.conviction || 0) * 100)}%
                </span>
              </div>

              {/* Connection */}
              <p className="text-body-sm text-brand-text">
                {s.connection}
              </p>

              {/* Gap filled */}
              <p className="text-body-sm text-brand-secondary italic">
                Gap: {s.gap_filled}
              </p>

              {/* Deep context (collapsible) */}
              {s.deep_context && (
                <details className="text-body-sm text-brand-secondary">
                  <summary className="cursor-pointer hover:text-brand-text">
                    Context
                  </summary>
                  <p className="mt-1 pl-2 border-l border-brand-border">
                    {s.deep_context}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missing regions */}
      {lineageMap?.missing_regions?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-border">
          <p className="uppercase-label text-brand-secondary mb-2">Unexplored Regions</p>
          <p className="text-body-sm text-brand-secondary">
            {lineageMap.missing_regions.join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LineageDiscoveries;
