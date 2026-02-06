import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Cross-Modal Coherence Component
 * Displays alignment between Visual DNA (CLAROSA) and Audio DNA
 * Unique differentiator: measures aesthetic coherence across modalities
 */
const CrossModalCoherence = ({ userId = 'default_user' }) => {
  const [coherence, setCoherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoherence();
  }, [userId]);

  const fetchCoherence = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/deep/cross-modal/analyze', {
        userId: userId === 'default_user' ? 1 : userId
      });

      if (response.data.success) {
        setCoherence(response.data.coherence);
      }
    } catch (error) {
      console.error('Error fetching cross-modal coherence:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-brand-border p-4">
        <p className="uppercase-label text-brand-secondary mb-3">Cross-Modal Alignment</p>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !coherence) {
    return (
      <div className="border border-brand-border p-4">
        <p className="uppercase-label text-brand-secondary mb-3">Cross-Modal Alignment</p>
        <p className="text-body-sm text-brand-secondary italic">
          {error || 'Connect CLAROSA and upload music to see cross-modal coherence'}
        </p>
      </div>
    );
  }

  const { overall, audioVisualMatch, energyAlignment, diversityAlignment, details } = coherence;

  return (
    <div className="border border-brand-border p-4">
      <p className="uppercase-label text-brand-secondary mb-3">Cross-Modal Alignment</p>

      {/* Overall Coherence */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-body-sm text-brand-text">Overall Coherence</p>
          <p className="text-display-sm text-brand-text">{(overall * 100).toFixed(0)}%</p>
        </div>
        <div className="h-3 bg-brand-border overflow-hidden">
          <div
            className="h-full bg-brand-text transition-all duration-500"
            style={{ width: `${overall * 100}%` }}
          />
        </div>
        <p className="text-body-xs text-brand-secondary mt-2 italic">
          {details.interpretation}
        </p>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3 mt-4 pt-4 border-t border-brand-border">
        {/* Audio-Visual Match */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-body-xs text-brand-secondary">Visual-Audio Warmth</p>
            <p className="text-body-xs text-brand-text">{(audioVisualMatch * 100).toFixed(0)}%</p>
          </div>
          <div className="h-2 bg-brand-border overflow-hidden">
            <div
              className="h-full bg-brand-text transition-all duration-500"
              style={{ width: `${audioVisualMatch * 100}%` }}
            />
          </div>
        </div>

        {/* Energy Alignment */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-body-xs text-brand-secondary">Energy Alignment</p>
            <p className="text-body-xs text-brand-text">{(energyAlignment * 100).toFixed(0)}%</p>
          </div>
          <div className="h-2 bg-brand-border overflow-hidden">
            <div
              className="h-full bg-brand-text transition-all duration-500"
              style={{ width: `${energyAlignment * 100}%` }}
            />
          </div>
        </div>

        {/* Diversity Alignment */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-body-xs text-brand-secondary">Palette Diversity Match</p>
            <p className="text-body-xs text-brand-text">{(diversityAlignment * 100).toFixed(0)}%</p>
          </div>
          <div className="h-2 bg-brand-border overflow-hidden">
            <div
              className="h-full bg-brand-text transition-all duration-500"
              style={{ width: `${diversityAlignment * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Details */}
      {details && (
        <div className="mt-4 pt-4 border-t border-brand-border">
          <div className="grid grid-cols-2 gap-4 text-body-xs">
            <div>
              <p className="text-brand-secondary mb-1">Visual</p>
              <p className="text-brand-text">{details.visualPalette}</p>
            </div>
            <div>
              <p className="text-brand-secondary mb-1">Audio</p>
              <p className="text-brand-text">{details.audioTonal}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossModalCoherence;
