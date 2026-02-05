import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Taste Coherence View
 * Displays how consistent vs eclectic the user's music taste is
 * Shows 6 coherence metrics with visual representation
 */
const TasteCoherenceView = ({ context, userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoherence();
  }, [context, userId]);

  const fetchCoherence = async () => {
    try {
      setLoading(true);
      const params = {};
      if (context) params.context = context;
      if (userId) params.userId = userId;

      const response = await axios.get('/api/audio/taste/coherence', { params });

      if (response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch taste coherence:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-brand-border p-6 text-center">
        <p className="text-brand-secondary">Calculating taste coherence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-brand-border p-6">
        <p className="text-brand-secondary">Error: {error}</p>
      </div>
    );
  }

  if (!data || !data.available) {
    return (
      <div className="border border-brand-border p-6">
        <p className="uppercase-label text-brand-secondary mb-3">Taste Coherence</p>
        <p className="text-body-sm text-brand-secondary mb-4">
          {data?.message || 'Import music to analyze taste coherence.'}
        </p>
        <p className="text-body-sm text-brand-secondary">
          Coherence measures how consistent vs eclectic your musical taste is across BPM, energy, genre, key, and mood.
        </p>
      </div>
    );
  }

  const { coherence, interpretation, trackCount } = data;

  // Get color for score
  const getScoreColor = (score) => {
    if (score >= 0.75) return 'text-blue-500';
    if (score >= 0.5) return 'text-purple-500';
    return 'text-pink-500';
  };

  const getBarColor = (score) => {
    if (score >= 0.75) return 'bg-blue-500';
    if (score >= 0.5) return 'bg-purple-500';
    return 'bg-pink-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.75) return 'Consistent';
    if (score >= 0.5) return 'Balanced';
    return 'Eclectic';
  };

  const metrics = [
    {
      name: 'BPM Consistency',
      value: coherence.bpmConsistency,
      description: 'How consistent your tempo preferences are'
    },
    {
      name: 'Energy Consistency',
      value: coherence.energyConsistency,
      description: 'How consistent the energy levels are'
    },
    {
      name: 'Genre Coherence',
      value: coherence.genreCoherence,
      description: 'How focused your genre selection is'
    },
    {
      name: 'Key Coherence',
      value: coherence.keyCoherence,
      description: 'How varied your key preferences are'
    },
    {
      name: 'Mood Coherence',
      value: coherence.moodCoherence,
      description: 'How consistent the emotional tone is'
    }
  ];

  return (
    <div className="border border-brand-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="uppercase-label text-brand-text mb-1">Taste Coherence</p>
          <p className="text-body-sm text-brand-secondary">
            Analyzed {trackCount} tracks
            {context && <span className="ml-1">({context})</span>}
          </p>
        </div>
        <button
          onClick={fetchCoherence}
          className="text-body-sm text-brand-secondary hover:text-brand-text transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overall Score */}
      <div className="mb-6 pb-6 border-b border-brand-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-body text-brand-secondary mb-1">Overall Coherence</p>
            <p className="text-body-sm text-brand-secondary">
              {interpretation.description}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-h2 font-bold ${getScoreColor(coherence.overall)}`}>
              {Math.round(coherence.overall * 100)}%
            </p>
            <p className="text-body-sm text-brand-secondary">
              {interpretation.overall}
            </p>
          </div>
        </div>

        <div className="w-full bg-brand-border h-3 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor(coherence.overall)} transition-all duration-500`}
            style={{ width: `${coherence.overall * 100}%` }}
          />
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        <p className="uppercase-label text-brand-secondary mb-3">Breakdown</p>

        {metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm font-medium text-brand-text">
                  {metric.name}
                </p>
                <p className="text-body-xs text-brand-secondary">
                  {metric.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-body-sm text-brand-text font-medium">
                  {Math.round(metric.value * 100)}%
                </p>
                <span className="text-body-xs text-brand-secondary">
                  {getScoreLabel(metric.value)}
                </span>
              </div>
            </div>

            <div className="w-full bg-brand-border h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(metric.value)} transition-all duration-300`}
                style={{ width: `${metric.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation Guide */}
      <div className="mt-6 pt-6 border-t border-brand-border">
        <p className="uppercase-label text-brand-secondary mb-3">What This Means</p>
        <div className="grid grid-cols-3 gap-4 text-body-xs">
          <div>
            <p className="text-blue-500 font-medium mb-1">75-100% Consistent</p>
            <p className="text-brand-secondary">
              Focused taste, clear preferences
            </p>
          </div>
          <div>
            <p className="text-purple-500 font-medium mb-1">50-74% Balanced</p>
            <p className="text-brand-secondary">
              Mix of consistency and variety
            </p>
          </div>
          <div>
            <p className="text-pink-500 font-medium mb-1">0-49% Eclectic</p>
            <p className="text-brand-secondary">
              Diverse, exploratory taste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasteCoherenceView;
