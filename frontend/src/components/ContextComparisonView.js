import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Context Comparison View
 * Displays comparison between DJ collection and personal music
 * Shows alignment scores and insights
 */
const ContextComparisonView = ({ userId }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, [userId]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audio/context/compare', {
        params: { userId: userId || 'default_user' }
      });

      if (response.data.success) {
        setComparison(response.data.comparison);
      }
    } catch (err) {
      console.error('Failed to fetch context comparison:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-brand-border p-6 text-center">
        <p className="text-brand-secondary">Loading context comparison...</p>
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

  if (!comparison || !comparison.available) {
    return (
      <div className="border border-brand-border p-6">
        <p className="uppercase-label text-brand-secondary mb-3">Context Comparison</p>
        <p className="text-body-sm text-brand-secondary mb-4">
          {comparison?.message || 'Import DJ library and upload personal tracks to see comparison.'}
        </p>
        <div className="space-y-2 text-body-sm text-brand-secondary">
          <p>To unlock context comparison:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Import your DJ library (Rekordbox or Serato)</li>
            <li>Upload your personal music or productions</li>
            <li>View how your public DJ taste compares to your personal aesthetic</li>
          </ol>
        </div>
      </div>
    );
  }

  // Get color for score
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Highly Aligned';
    if (score >= 50) return 'Moderately Aligned';
    return 'Divergent';
  };

  return (
    <div className="border border-brand-border p-6">
      <p className="uppercase-label text-brand-text mb-4">Context Comparison</p>

      {/* Overall Score */}
      <div className="mb-6 pb-6 border-b border-brand-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body text-brand-secondary">Overall Alignment</span>
          <span className={`text-h2 font-bold ${getScoreColor(comparison.overall)}`}>
            {comparison.overall}%
          </span>
        </div>
        <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-text transition-all duration-500"
            style={{ width: `${comparison.overall}%` }}
          />
        </div>
        <p className="text-body-sm text-brand-secondary mt-2">
          {getScoreLabel(comparison.overall)}
        </p>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-body-sm text-brand-secondary mb-1">BPM Overlap</p>
          <p className="text-body font-medium">{comparison.bpmOverlap}%</p>
        </div>
        <div>
          <p className="text-body-sm text-brand-secondary mb-1">Energy Alignment</p>
          <p className="text-body font-medium">{comparison.energyAlignment}%</p>
        </div>
        <div>
          <p className="text-body-sm text-brand-secondary mb-1">Key Alignment</p>
          <p className="text-body font-medium">{comparison.keyAlignment}%</p>
        </div>
        <div>
          <p className="text-body-sm text-brand-secondary mb-1">Sonic Alignment</p>
          <p className="text-body font-medium">{comparison.sonicAlignment}%</p>
          <p className="text-body-xs text-brand-secondary">Coming soon</p>
        </div>
      </div>

      {/* Context Summaries */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-brand-border">
        <div>
          <p className="uppercase-label text-brand-secondary mb-2">DJ Collection</p>
          <p className="text-body-sm">
            <span className="text-brand-text font-medium">
              {comparison.djContext.trackCount}
            </span>
            <span className="text-brand-secondary"> tracks</span>
          </p>
        </div>
        <div>
          <p className="uppercase-label text-brand-secondary mb-2">Personal Music</p>
          <p className="text-body-sm">
            <span className="text-brand-text font-medium">
              {comparison.myMusicContext.trackCount}
            </span>
            <span className="text-brand-secondary"> tracks</span>
          </p>
        </div>
      </div>

      {/* Insights */}
      {comparison.insights && comparison.insights.length > 0 && (
        <div>
          <p className="uppercase-label text-brand-secondary mb-3">Insights</p>
          <div className="space-y-2">
            {comparison.insights.map((insight, idx) => (
              <div
                key={idx}
                className="border border-brand-border p-3 text-body-sm text-brand-text"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchComparison}
        className="mt-6 btn-secondary w-full"
      >
        Refresh Comparison
      </button>
    </div>
  );
};

export default ContextComparisonView;
