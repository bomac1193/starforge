import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CrossModalCoherence from './CrossModalCoherence';

/**
 * Coherence Dashboard - Main View
 * Central hub showing Audio DNA + Visual DNA + Cross-Modal Alignment
 * Makes aesthetic coherence the centerpiece of the experience
 */
const CoherenceDashboard = ({ userId = 'default_user' }) => {
  const [audioDNA, setAudioDNA] = useState(null);
  const [visualDNA, setVisualDNA] = useState(null);
  const [tasteCoherence, setTasteCoherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [userId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Audio DNA (influence genealogy)
      const audioResponse = await axios.get(`/api/deep/audio/influence-genealogy?user_id=${userId}&mode=hybrid`);
      if (audioResponse.data.success) {
        setAudioDNA(audioResponse.data.genealogy);
      }

      // Fetch Taste Coherence
      const coherenceResponse = await axios.get(`/api/audio/taste/coherence?user_id=${userId}`);
      if (coherenceResponse.data.success) {
        setTasteCoherence(coherenceResponse.data);
      }

      // Fetch Visual DNA (CLAROSA)
      const visualResponse = await axios.get(`/api/deep/visual/dna?user_id=${userId}`);
      if (visualResponse.data.success && visualResponse.data.visualDna) {
        setVisualDNA(visualResponse.data.visualDna);
      }

    } catch (error) {
      console.error('Error fetching DNA data:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
          <p className="text-brand-secondary">Analyzing your aesthetic DNA...</p>
        </div>
      </div>
    );
  }

  const hasData = audioDNA || visualDNA;

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <h2 className="text-display-md text-brand-text mb-4">AESTHETIC COHERENCE ENGINE</h2>
        <p className="text-body text-brand-secondary mb-8">
          Upload music and connect CLAROSA to analyze your aesthetic DNA across audio and visual domains.
        </p>
        <div className="grid grid-cols-2 gap-6 text-left">
          <div className="border border-brand-border p-6">
            <h3 className="text-brand-text font-medium mb-2">AUDIO DNA</h3>
            <p className="text-body-sm text-brand-secondary">
              Upload tracks or import Rekordbox library to analyze your sonic palette, taste coherence, and genre lineage.
            </p>
          </div>
          <div className="border border-brand-border p-6">
            <h3 className="text-brand-text font-medium mb-2">VISUAL DNA</h3>
            <p className="text-body-sm text-brand-secondary">
              Connect CLAROSA to analyze your photo aesthetics, color palettes, and visual themes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Overall Coherence */}
      <div className="border border-brand-border p-8">
        <div className="max-w-3xl">
          <h2 className="text-display-lg text-brand-text mb-3">AESTHETIC DNA</h2>
          <p className="text-body text-brand-secondary mb-6">
            Deep analysis of your creative identity across audio and visual domains
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6">
            {audioDNA && (
              <div>
                <p className="uppercase-label text-brand-secondary mb-2">Audio Tracks</p>
                <p className="text-display-md text-brand-text">{audioDNA.trackCount || 0}</p>
              </div>
            )}
            {visualDNA && (
              <div>
                <p className="uppercase-label text-brand-secondary mb-2">Visual Samples</p>
                <p className="text-display-md text-brand-text">{visualDNA.photoCount || 0}</p>
              </div>
            )}
            {tasteCoherence && (
              <div>
                <p className="uppercase-label text-brand-secondary mb-2">Taste Coherence</p>
                <p className="text-display-md text-brand-text">
                  {(tasteCoherence.coherence?.overall * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Audio DNA + Visual DNA */}
      <div className="grid grid-cols-2 gap-8">
        {/* Audio DNA Card */}
        <div className="border border-brand-border p-6">
          <h3 className="text-display-sm text-brand-text mb-4">AUDIO DNA</h3>

          {audioDNA ? (
            <div className="space-y-4">
              {/* Primary Genre */}
              {audioDNA.primaryGenre && (
                <div>
                  <p className="uppercase-label text-brand-secondary mb-2">Primary Genre</p>
                  <p className="text-brand-text font-medium">{audioDNA.primaryGenre.name}</p>
                  <p className="text-body-xs text-brand-secondary mt-1">
                    {audioDNA.primaryGenre.cultural_context}
                  </p>
                </div>
              )}

              {/* Top Influences */}
              {audioDNA.influences && audioDNA.influences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-3">Genre Distribution</p>
                  <div className="space-y-2">
                    {audioDNA.influences.slice(0, 5).map((influence, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-body-sm mb-1">
                          <span className="text-brand-text">{influence.genre.name}</span>
                          <span className="text-brand-secondary">{influence.percentage}%</span>
                        </div>
                        <div className="h-2 bg-brand-border overflow-hidden">
                          <div
                            className="h-full bg-brand-text transition-all"
                            style={{ width: `${influence.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sonic Signature */}
              {audioDNA.influences && audioDNA.influences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">Sonic Signature</p>
                  <div className="grid grid-cols-2 gap-3 text-body-sm">
                    <div>
                      <p className="text-brand-secondary">Avg BPM</p>
                      <p className="text-brand-text font-medium">
                        {Math.round(
                          audioDNA.influences.reduce((sum, i) => sum + (i.avgBpm || 0), 0) /
                          audioDNA.influences.length
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-secondary">Avg Energy</p>
                      <p className="text-brand-text font-medium">
                        {(
                          audioDNA.influences.reduce((sum, i) => sum + (i.avgEnergy || 0), 0) /
                          audioDNA.influences.length * 100
                        ).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-secondary">Avg Valence</p>
                      <p className="text-brand-text font-medium">
                        {(
                          audioDNA.influences.reduce((sum, i) => sum + (i.avgValence || 0), 0) /
                          audioDNA.influences.length * 100
                        ).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-secondary">Genres</p>
                      <p className="text-brand-text font-medium">{audioDNA.influences.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-brand-secondary italic">
              Upload tracks to analyze your audio DNA
            </p>
          )}
        </div>

        {/* Visual DNA Card */}
        <div className="border border-brand-border p-6">
          <h3 className="text-display-sm text-brand-text mb-4">VISUAL DNA</h3>

          {visualDNA ? (
            <div className="space-y-4">
              {/* Dominant Colors */}
              {visualDNA.palette && (
                <div>
                  <p className="uppercase-label text-brand-secondary mb-2">Color Palette</p>
                  <div className="flex gap-2 mb-3">
                    {visualDNA.palette.slice(0, 6).map((color, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded border border-brand-border"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} (${color.prominence}%)`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {visualDNA.themes && visualDNA.themes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">Visual Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {visualDNA.themes.slice(0, 8).map((theme, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-brand-border text-brand-text text-body-xs rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Characteristics */}
              {visualDNA.styleDescription && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">Style</p>
                  <p className="text-body-sm text-brand-text">{visualDNA.styleDescription}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-brand-secondary italic">
              Connect CLAROSA to analyze your visual DNA
            </p>
          )}
        </div>
      </div>

      {/* Taste Coherence Section */}
      {tasteCoherence && tasteCoherence.coherence && (
        <div className="border border-brand-border p-6">
          <h3 className="text-display-sm text-brand-text mb-4">TASTE COHERENCE</h3>
          <p className="text-body-sm text-brand-secondary mb-4">{tasteCoherence.interpretation?.description}</p>

          <div className="grid grid-cols-3 gap-4">
            {Object.entries(tasteCoherence.coherence).map(([key, value]) => {
              if (key === 'overall') return null;
              return (
                <div key={key} className="border border-brand-border p-4">
                  <p className="text-body-xs text-brand-secondary mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-display-sm text-brand-text">{(value * 100).toFixed(0)}%</p>
                  <div className="h-2 bg-brand-border overflow-hidden mt-2">
                    <div
                      className="h-full bg-brand-text"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-Modal Coherence */}
      {audioDNA && visualDNA && (
        <div>
          <CrossModalCoherence userId={userId} />
        </div>
      )}

      {/* Call to Action */}
      <div className="border border-brand-border p-6">
        <p className="text-body text-brand-text mb-3">
          Your aesthetic DNA is your creative fingerprint. Use it to maintain coherence across everything you create.
        </p>
        <div className="flex gap-4">
          <button className="btn-primary">
            View Influence Genealogy
          </button>
          <button className="btn-secondary">
            Filter Library by Coherence
          </button>
          <button className="btn-secondary">
            Export & Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoherenceDashboard;
