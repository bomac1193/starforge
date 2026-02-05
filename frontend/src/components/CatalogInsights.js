import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Catalog Insights Component
 * Displays aggregate analysis across entire music library
 * Shows taste coherence, genre distribution, evolution, Influence Genealogy
 */
const CatalogInsights = ({ userId = 'default_user' }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catalogMode, setCatalogMode] = useState('hybrid'); // 'hybrid' | 'dj' | 'original'
  const [genreView, setGenreView] = useState('detailed'); // 'simplified' | 'detailed'

  useEffect(() => {
    fetchAnalysis();
  }, [userId, catalogMode, genreView]);

  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await axios.get('/api/library/catalog/analyze', {
        params: {
          user_id: userId,
          refresh: forceRefresh,
          mode: catalogMode,
          granularity: genreView
        }
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Error fetching catalog analysis:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalysis(true);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-3"></div>
        <p className="text-body-sm text-brand-secondary">Analyzing your catalog...</p>
      </div>
    );
  }

  if (!analysis || !analysis.available) {
    return (
      <div className="card">
        <p className="text-body-sm text-brand-secondary text-center">
          {analysis?.message || 'No tracks available for analysis. Upload some music to get started!'}
        </p>
      </div>
    );
  }

  const { aggregateStats, tasteCoherence, genreDistribution, distributions, evolution, fromCache, lastAnalysis } = analysis;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-display-md mb-1">Catalog Analysis</h3>
            <p className="text-body-xs text-brand-secondary">
              {analysis.trackCount} tracks analyzed
              {fromCache && ` • From cache`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-between items-center border-b border-brand-border">
          <div className="flex gap-0">
            <button
              onClick={() => setCatalogMode('hybrid')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                catalogMode === 'hybrid'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-brand-secondary hover:text-brand-text'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setCatalogMode('dj')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                catalogMode === 'dj'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-brand-secondary hover:text-brand-text'
              }`}
            >
              DJ Library
            </button>
            <button
              onClick={() => setCatalogMode('original')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                catalogMode === 'original'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-brand-secondary hover:text-brand-text'
              }`}
            >
              My Music
            </button>
          </div>

          {/* Genre View Toggle */}
          <div className="flex gap-2 px-4">
            <button
              onClick={() => setGenreView('simplified')}
              className={`px-3 py-1 text-xs transition-all ${
                genreView === 'simplified'
                  ? 'text-brand-text bg-brand-border'
                  : 'text-brand-secondary hover:text-brand-text'
              }`}
            >
              Simplified
            </button>
            <button
              onClick={() => setGenreView('detailed')}
              className={`px-3 py-1 text-xs transition-all ${
                genreView === 'detailed'
                  ? 'text-brand-text bg-brand-border'
                  : 'text-brand-secondary hover:text-brand-text'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      {aggregateStats && (
        <div className="card">
          <h4 className="uppercase-label text-brand-secondary mb-4">Sonic Signature</h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-body-xs text-brand-secondary mb-2">BPM Range</p>
              <p className="text-display-sm text-brand-text">
                {aggregateStats.minBpm?.toFixed(0)} - {aggregateStats.maxBpm?.toFixed(0)}
              </p>
              {aggregateStats.preferredBpmMin && aggregateStats.preferredBpmMax && (
                <p className="text-body-xs text-brand-accent mt-1">
                  ⭐ Preference: {aggregateStats.preferredBpmMin} - {aggregateStats.preferredBpmMax}
                  {aggregateStats.preferredBpmCoverage && ` (${aggregateStats.preferredBpmCoverage}%)`}
                </p>
              )}
              <p className="text-body-xs text-brand-secondary mt-1">
                Avg: {aggregateStats.avgBpm?.toFixed(1)}
              </p>
            </div>

            <div>
              <p className="text-body-xs text-brand-secondary mb-2">Energy Level</p>
              <p className="text-display-sm text-brand-text">
                {(aggregateStats.avgEnergy * 100)?.toFixed(0)}%
              </p>
              <div className="mt-2 h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary"
                  style={{ width: `${aggregateStats.avgEnergy * 100}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-body-xs text-brand-secondary mb-2">Valence (Mood)</p>
              <p className="text-display-sm text-brand-text">
                {(aggregateStats.avgValence * 100)?.toFixed(0)}%
              </p>
              <p className="text-body-xs text-brand-secondary mt-1">
                {aggregateStats.avgValence > 0.6 ? 'Positive' : aggregateStats.avgValence > 0.4 ? 'Neutral' : 'Dark'}
              </p>
            </div>

            <div>
              <p className="text-body-xs text-brand-secondary mb-2">Total Duration</p>
              <p className="text-display-sm text-brand-text">
                {(aggregateStats.totalDuration / 3600).toFixed(1)} hrs
              </p>
            </div>

            <div>
              <p className="text-body-xs text-brand-secondary mb-2">Avg Track Length</p>
              <p className="text-display-sm text-brand-text">
                {Math.floor(aggregateStats.avgDuration / 60)}:{Math.floor(aggregateStats.avgDuration % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div>
              <p className="text-body-xs text-brand-secondary mb-2">Total Plays</p>
              <p className="text-display-sm text-brand-text">
                {aggregateStats.totalPlayCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Taste Coherence */}
      {tasteCoherence && (
        <div className="card">
          <h4 className="uppercase-label text-brand-secondary mb-4">Taste Coherence</h4>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-body-sm text-brand-text">Overall Coherence</p>
              <p className="text-display-sm text-brand-text">{(tasteCoherence.overall * 100).toFixed(0)}%</p>
            </div>
            <div className="h-3 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-brand-primary"
                style={{ width: `${tasteCoherence.overall * 100}%` }}
              />
            </div>
            <p className="text-body-xs text-brand-secondary mt-2 italic">
              {tasteCoherence.interpretation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-body-xs text-brand-secondary">BPM Consistency</p>
                <p className="text-body-xs text-brand-text">{(tasteCoherence.bpmConsistency * 100).toFixed(0)}%</p>
              </div>
              <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent"
                  style={{ width: `${tasteCoherence.bpmConsistency * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <p className="text-body-xs text-brand-secondary">Energy Consistency</p>
                <p className="text-body-xs text-brand-text">{(tasteCoherence.energyConsistency * 100).toFixed(0)}%</p>
              </div>
              <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent"
                  style={{ width: `${tasteCoherence.energyConsistency * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <p className="text-body-xs text-brand-secondary">Key Coherence</p>
                <p className="text-body-xs text-brand-text">{(tasteCoherence.keyCoherence * 100).toFixed(0)}%</p>
              </div>
              <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent"
                  style={{ width: `${tasteCoherence.keyCoherence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genre Distribution */}
      {genreDistribution && genreDistribution.length > 0 && (
        <div className="card">
          <h4 className="uppercase-label text-brand-secondary mb-4">Genre Distribution</h4>

          <div className="space-y-3">
            {genreDistribution.map((genre, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <p className="text-body-sm text-brand-text">{genre.genre}</p>
                  <p className="text-body-sm text-brand-secondary">
                    {genre.count} tracks ({genre.percentage}%)
                  </p>
                </div>
                <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BPM Distribution */}
      {distributions && distributions.bpm && (
        <div className="card">
          <h4 className="uppercase-label text-brand-secondary mb-4">BPM Distribution</h4>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-body-xs text-brand-secondary">25th Percentile</p>
              <p className="text-body-sm text-brand-text">{distributions.bpm.percentiles.p25?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-body-xs text-brand-secondary">Median</p>
              <p className="text-body-sm text-brand-text">{distributions.bpm.percentiles.p50?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-body-xs text-brand-secondary">75th Percentile</p>
              <p className="text-body-sm text-brand-text">{distributions.bpm.percentiles.p75?.toFixed(1)}</p>
            </div>
          </div>

          {distributions.bpm.histogram && (
            <div className="flex items-end gap-1 h-32">
              {distributions.bpm.histogram.map((bin, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div
                    className="bg-purple-500/50 hover:bg-purple-500 transition-colors"
                    style={{ height: `${(bin.count / Math.max(...distributions.bpm.histogram.map(b => b.count))) * 100}%` }}
                    title={`${bin.range}: ${bin.count} tracks`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Temporal Evolution */}
      {evolution && evolution.available && (
        <div className="card">
          <h4 className="uppercase-label text-brand-secondary mb-4">Taste Evolution</h4>

          {evolution.trends && evolution.trends.available && (
            <div className="mb-4 flex gap-6">
              <div>
                <p className="text-body-xs text-brand-secondary">BPM Trend</p>
                <p className="text-body-sm text-brand-text capitalize">{evolution.trends.bpmTrend}</p>
              </div>
              <div>
                <p className="text-body-xs text-brand-secondary">Energy Trend</p>
                <p className="text-body-sm text-brand-text capitalize">{evolution.trends.energyTrend}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {evolution.timeline && evolution.timeline.slice(-6).map((month, i) => (
              <div key={i} className="flex justify-between text-body-xs">
                <span className="text-brand-secondary">{month.month}</span>
                <span className="text-brand-text">{month.trackCount} tracks</span>
                <span className="text-brand-secondary">
                  {month.avgBpm?.toFixed(0)} BPM • {(month.avgEnergy * 100)?.toFixed(0)}% energy
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogInsights;
