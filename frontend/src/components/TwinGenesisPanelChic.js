import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioAnalysisCompact from './AudioAnalysisCompact';
import AudioDNAPanel from './AudioDNAPanel';
import CrossModalCoherence from './CrossModalCoherence';
import ContextComparisonView from './ContextComparisonView';
import TasteCoherenceView from './TasteCoherenceView';
import InfluenceGenealogyPanel from './InfluenceGenealogyPanel';
import WritingSamplesInput from './WritingSamplesInput';
import AIGenerationPanel from './AIGenerationPanel';

/**
 * Minimal, chic Twin Genesis Panel
 * No emojis, clean typography, editorial aesthetic
 * Now with tier-aware features and onboarding guidance
 */
const TwinGenesisPanelChic = ({ onTwinGenerated, onGlowChange }) => {
  const [caption, setCaption] = useState('');
  const [bio, setBio] = useState('');
  const [glowLevel, setGlowLevel] = useState(3);
  const [clarosaData, setClarosaData] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [rekordboxData, setRekordboxData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectingClarosa, setConnectingClarosa] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('personal');
  const [usageInfo, setUsageInfo] = useState(null);

  // Fetch subscription status on mount
  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get('/api/subscription/status');
      if (response.data.success) {
        setSubscriptionTier(response.data.tier);
        setUsageInfo(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const handleGlowChange = (e) => {
    const level = parseInt(e.target.value);
    setGlowLevel(level);
    onGlowChange(level);
  };

  const handleConnectClarosa = async () => {
    setConnectingClarosa(true);

    try {
      const profileRes = await axios.get('/api/deep/clarosa/profile');
      // Fetch ALL photos (not just top 20)
      const photosRes = await axios.get('/api/deep/clarosa/top-photos', {
        params: {
          limit: 500,  // High limit to get all photos
          minScore: 0  // Include all scores, not just top-rated
        }
      });
      const dnaRes = await axios.get('/api/deep/clarosa/visual-dna');

      setClarosaData({
        profile: profileRes.data.profile,
        photos: photosRes.data.photos,
        visualDNA: dnaRes.data.visualDNA
      });
    } catch (error) {
      console.error('Failed to connect to CLAROSA:', error);
      setClarosaData({
        error: true,
        visualDNA: {
          styleDescription: 'Connection failed',
          confidence: 0
        }
      });
    } finally {
      setConnectingClarosa(false);
    }
  };

  const handleGenerateTwin = async () => {
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('bio', bio);
      formData.append('glowLevel', glowLevel);

      const response = await axios.post('/api/twin/generate-enhanced', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        onTwinGenerated({
          ...response.data.twinData,
          clarosaData,
          audioData,
          rekordboxData
        });
      }
    } catch (error) {
      console.error('Failed to generate Twin:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = (audioData || clarosaData || rekordboxData) && (caption || bio);

  // Helper: Tier Badge Component
  const TierBadge = ({ tier }) => (
    <span className="ml-2 px-2 py-0.5 text-xs border border-brand-text text-brand-text">
      {tier.toUpperCase()}
    </span>
  );

  // Helper: Check if user has access to tier
  const hasTierAccess = (requiredTier) => {
    const tierLevels = { personal: 0, pro: 1, elite: 2 };
    return tierLevels[subscriptionTier] >= tierLevels[requiredTier];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-display-lg mb-2">Twin Genesis</h2>
        <p className="text-body text-brand-secondary">
          Connect your creative catalogs. The Twin learns from your actual data.
        </p>
      </div>

      {/* Onboarding Guide */}
      {!audioData && !clarosaData && !rekordboxData && (
        <div className="card bg-brand-border">
          <h3 className="text-display-sm mb-4">Start Here</h3>
          <div className="space-y-4 text-body-sm text-brand-secondary">
            <p className="text-brand-text font-medium">
              To generate your Twin OS, connect at least one creative catalog:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <span className="text-brand-text">Visual DNA:</span> Connect CLAROSA to analyze your photo aesthetic
              </li>
              <li>
                <span className="text-brand-text">Audio DNA:</span> Upload tracks or import DJ library
                {subscriptionTier === 'personal' && (
                  <span className="text-brand-secondary ml-2">
                    ({usageInfo?.remaining || 50} uploads remaining • <a href="/pricing" className="underline">Upgrade for unlimited</a>)
                  </span>
                )}
              </li>
              <li>
                <span className="text-brand-text">Voice & Identity:</span> Add caption samples and bio below
              </li>
            </ol>
            {subscriptionTier === 'personal' && (
              <div className="mt-4 pt-4 border-t border-brand-border">
                <p className="text-brand-text font-medium mb-2">Want more?</p>
                <p>
                  Upgrade to <a href="/pricing" className="underline text-brand-text">Pro</a> for DJ library import, context comparison, taste coherence, and unlimited tracks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtaste Integration */}
      <div className="card">
        <h3 className="text-display-md mb-4">Subtaste</h3>
        <p className="text-body text-brand-secondary mb-6">
          Connect your aesthetic preference system
        </p>
        <button
          className="btn-primary w-full"
          disabled
        >
          Connect Subtaste
        </button>
      </div>

      {/* Visual Integration */}
      <div className="card">
        <h3 className="text-display-md mb-4">Visual Catalog</h3>
        <p className="text-body text-brand-secondary mb-6">
          Direct access to your CLAROSA photo collection
        </p>

        <button
          onClick={handleConnectClarosa}
          disabled={connectingClarosa || (clarosaData && !clarosaData.error)}
          className={
            clarosaData && !clarosaData.error
              ? 'btn-secondary w-full opacity-50 cursor-not-allowed'
              : 'btn-primary w-full'
          }
        >
          {connectingClarosa
            ? 'Connecting...'
            : clarosaData && !clarosaData.error
            ? 'CLAROSA Connected'
            : 'Connect CLAROSA'}
        </button>

        {/* CLAROSA Results */}
        {clarosaData && !clarosaData.error && (
          <div className="mt-6 border border-brand-border p-4">
            <p className="uppercase-label text-brand-secondary mb-3">Visual DNA</p>

            {/* Style Description */}
            <p className="text-body text-brand-text mb-4">
              {clarosaData.visualDNA?.styleDescription}
            </p>

            {/* Color Palette */}
            {clarosaData.visualDNA?.colorPalette && clarosaData.visualDNA.colorPalette.length > 0 && (
              <div className="mb-4">
                <p className="uppercase-label text-brand-secondary mb-2">Color Palette</p>
                <div className="flex gap-2">
                  {clarosaData.visualDNA.colorPalette.map((color, idx) => (
                    <div key={idx} className="flex-1">
                      <div
                        className="h-12 border border-brand-border"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} (${color.hex})`}
                      />
                      <p className="text-body-sm text-brand-secondary mt-1 text-center">
                        {color.hex}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="text-body-sm text-brand-secondary">
              {clarosaData.profile?.stats?.total_photos || 0} photos analyzed •{' '}
              {clarosaData.profile?.stats?.highlight_count || 0} highlights
            </div>
          </div>
        )}

        {/* Audio DNA Panel - integrated below Visual DNA */}
        <AudioDNAPanel
          audioData={audioData}
          rekordboxData={rekordboxData}
          clarosaData={clarosaData}
        />

        {/* Cross-Modal Coherence - Visual + Audio Alignment */}
        <div className="mt-6">
          <CrossModalCoherence userId="default_user" />
        </div>

        {/* Context Comparison - DJ vs Personal Music */}
        <div className="mt-6">
          <ContextComparisonView userId="default_user" />
        </div>

        {/* Taste Coherence Score */}
        <div className="mt-6">
          <TasteCoherenceView userId="default_user" />
        </div>

        {/* Influence Genealogy - Elite Feature */}
        <div className="mt-6">
          <InfluenceGenealogyPanel userId="default_user" />
        </div>
      </div>

      {/* Writing Samples - Train Your Voice */}
      <div className="mt-6">
        <WritingSamplesInput userId="default_user" />
      </div>

      {/* AI Generation - Personal AI Twin */}
      <div className="mt-6">
        <AIGenerationPanel userId="default_user" />
      </div>

      {/* Audio Analysis - Compact Unified */}
      <AudioAnalysisCompact
        onAnalysisComplete={(data) => setAudioData(data)}
        onRekordboxImport={(data) => setRekordboxData(data)}
      />

      {/* Voice & Identity */}
      <div className="card">
        <h3 className="text-display-md mb-4">Voice & Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="block uppercase-label text-brand-secondary mb-2">
              Caption Sample
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="How do you caption your work? Drop an example..."
              className="input-field h-24 resize-none"
            />
          </div>
          <div>
            <label className="block uppercase-label text-brand-secondary mb-2">
              Bio / Artist Statement
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Who are you? What do you make?"
              className="input-field h-32 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Energy Level */}
      <div className="card">
        <h3 className="text-display-md mb-4">Energy Check</h3>
        <p className="text-body text-brand-secondary mb-6">Current energy level</p>

        <div className="flex items-center gap-4">
          <span className="uppercase-label text-brand-secondary">Low</span>
          <input
            type="range"
            min="1"
            max="5"
            value={glowLevel}
            onChange={handleGlowChange}
            className="flex-1 h-1 bg-brand-border appearance-none cursor-pointer accent-brand-text"
          />
          <span className="uppercase-label text-brand-secondary">High</span>
        </div>

        <div className="mt-6 text-center">
          <span className="text-display-md text-brand-text">
            {glowLevel}/5
          </span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateTwin}
        disabled={!canGenerate || isGenerating}
        className="btn-primary w-full py-4"
      >
        {isGenerating ? 'Generating Twin...' : 'Generate Twin OS'}
      </button>
    </div>
  );
};

export default TwinGenesisPanelChic;
