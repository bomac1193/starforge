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
import ProjectDNAPanel from './ProjectDNAPanel';
import LineageDiscoveries from './LineageDiscoveries';

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
  const [totalTracks, setTotalTracks] = useState(null);
  const [projectDnaData, setProjectDnaData] = useState(null);
  const [subtasteData, setSubtasteData] = useState(null);
  const [subtasteConnecting, setSubtasteConnecting] = useState(false);
  const [subtasteSource, setSubtasteSource] = useState(null); // 'auto' | 'quiz'

  // Fetch subscription status, track count, and auto-classify on mount
  useEffect(() => {
    fetchSubscriptionStatus();
    fetchTotalTracks();
    fetchAutoClassification();
    fetchCachedProjectDNA();
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

  const fetchTotalTracks = async () => {
    try {
      const response = await axios.get('/api/library/stats', {
        params: { user_id: 'default_user' }
      });
      if (response.data.success) {
        setTotalTracks(response.data.stats.totalTracks);
      }
    } catch (error) {
      console.error('Failed to fetch track count:', error);
    }
  };

  const fetchAutoClassification = async () => {
    try {
      const response = await axios.get('/api/subtaste/auto/default_user');
      if (response.data.success && response.data.classification) {
        setSubtasteData(response.data.classification);
        setSubtasteSource('auto');
      }
    } catch (error) {
      // Auto-classification not available yet — that's fine
    }
  };

  const fetchCachedProjectDNA = async () => {
    try {
      const response = await axios.get('/api/project-dna/default');
      if (response.data.success) {
        setProjectDnaData(response.data.projectDNA);
      }
    } catch {
      // No cached Project DNA — that's fine
    }
  };

  const handleConnectSubtaste = async () => {
    setSubtasteConnecting(true);
    try {
      // First try to fetch existing quiz genome
      const response = await axios.get('/api/subtaste/genome/default_user');
      if (response.data.success) {
        setSubtasteData(response.data.genome?.archetype || response.data.genome);
        setSubtasteSource('quiz');
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 503) {
        // No genome or app not running — open quiz
        window.open('http://localhost:3001/quiz', '_blank');
      }
    } finally {
      setSubtasteConnecting(false);
    }
  };

  const handleProjectDnaScanComplete = (projectDNA) => {
    setProjectDnaData(projectDNA);
    // Re-run auto-classification with new Project DNA data
    fetchAutoClassification();
  };

  const handleUploadSuccess = (uploadedCount) => {
    // Update total tracks count
    setTotalTracks(prev => (prev || 0) + uploadedCount);
  };

  const handleGlowChange = (e) => {
    const level = parseInt(e.target.value);
    setGlowLevel(level);
    onGlowChange(level);
  };

  const handleConnectClarosa = async () => {
    setConnectingClarosa(true);

    try {
      const [profileRes, photosRes, dnaRes] = await Promise.all([
        axios.get('/api/deep/clarosa/profile'),
        axios.get('/api/deep/clarosa/top-photos', {
          params: { limit: 500, minScore: 0 }
        }),
        axios.get('/api/deep/clarosa/visual-dna'),
      ]);

      // Also store Visual DNA in the twin cache for context endpoint
      try {
        await axios.post('/api/twin/visual-dna/connect-clarosa', {
          user_id: 'default_user',
        });
      } catch (cacheErr) {
        console.warn('Visual DNA cache store failed (non-fatal):', cacheErr.message);
      }

      setClarosaData({
        profile: profileRes.data.profile,
        photos: photosRes.data.photos,
        visualDNA: dnaRes.data.visualDNA
      });

      // Re-run auto-classification now that Visual DNA is available
      fetchAutoClassification();
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

  const canGenerate = (audioData || clarosaData || rekordboxData || projectDnaData) && (caption || bio);

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
                {totalTracks !== null && totalTracks > 0 && (
                  <span className="text-brand-text ml-2">
                    ({totalTracks} track{totalTracks !== 1 ? 's' : ''} in library)
                  </span>
                )}
                {subscriptionTier === 'personal' && (
                  <span className="text-brand-secondary ml-2">
                    ({usageInfo?.remaining || 50} uploads remaining • <a href="/pricing" className="underline">Upgrade for unlimited</a>)
                  </span>
                )}
              </li>
              <li>
                <span className="text-brand-text">Project DNA:</span> Upload project files or scan a directory to extract your identity
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

      {/* Subtaste Classification */}
      <div className="card">
        <h3 className="text-display-md mb-4">Taste Archetype</h3>
        <p className="text-body text-brand-secondary mb-4">
          {subtasteData
            ? `Classified from ${subtasteSource === 'quiz' ? 'quiz responses' : 'your creative signals'}`
            : 'Your archetype is auto-classified from your creative data'}
        </p>

        {subtasteData ? (
          <div className="space-y-4">
            {/* Primary archetype */}
            <div className="border border-brand-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-display-sm">{subtasteData.primary?.glyph || subtasteData.glyph || ''}</span>
                <div>
                  <p className="text-body text-brand-text font-medium">
                    {subtasteData.primary?.designation || subtasteData.designation || ''}
                  </p>
                  <p className="text-body-sm text-brand-secondary">
                    {subtasteData.primary?.creativeMode || subtasteData.creativeMode || ''}
                  </p>
                </div>
                {(subtasteData.primary?.confidence || subtasteData.confidence) > 0 && (
                  <span className="ml-auto text-body-sm text-brand-secondary font-mono">
                    {Math.round((subtasteData.primary?.confidence || subtasteData.confidence) * 100)}%
                  </span>
                )}
              </div>
              {subtasteData.primary?.essence && (
                <p className="text-body-sm text-brand-secondary italic">
                  {subtasteData.primary.essence}
                </p>
              )}
              {/* Shadow / tension */}
              {subtasteData.primary?.shadow && (
                <div className="mt-3 pt-3 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-1">Shadow</p>
                  <p className="text-body-sm text-brand-secondary">{subtasteData.primary.shadow}</p>
                </div>
              )}
            </div>

            {/* Secondary + Tertiary stack */}
            {(subtasteData.secondary || subtasteData.tertiary) && (
              <div className="space-y-2">
                {subtasteData.secondary && (
                  <div className="flex items-center gap-2 text-body-sm border border-brand-border p-3">
                    <span className="text-brand-text">{subtasteData.secondary.glyph}</span>
                    <span className="text-brand-text">{subtasteData.secondary.designation}</span>
                    <span className="text-brand-secondary">{subtasteData.secondary.creativeMode}</span>
                    {subtasteData.secondary.confidence > 0 && (
                      <span className="ml-auto font-mono text-brand-secondary">
                        {Math.round(subtasteData.secondary.confidence * 100)}%
                      </span>
                    )}
                  </div>
                )}
                {subtasteData.tertiary && (
                  <div className="flex items-center gap-2 text-body-sm border border-brand-border p-3 opacity-70">
                    <span className="text-brand-text">{subtasteData.tertiary.glyph}</span>
                    <span className="text-brand-text">{subtasteData.tertiary.designation}</span>
                    <span className="text-brand-secondary">{subtasteData.tertiary.creativeMode}</span>
                    {subtasteData.tertiary.confidence > 0 && (
                      <span className="ml-auto font-mono text-brand-secondary">
                        {Math.round(subtasteData.tertiary.confidence * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Psychometric dimensions — horizontal bars */}
            {subtasteData.distribution && (
              <div className="border border-brand-border p-4">
                <p className="uppercase-label text-brand-secondary mb-3">Archetype Distribution</p>
                <div className="space-y-1">
                  {Object.entries(subtasteData.distribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([designation, weight]) => (
                      <div key={designation} className="flex items-center gap-2">
                        <span className="text-body-sm text-brand-secondary font-mono w-10">{designation}</span>
                        <div className="flex-1 h-2 bg-brand-border">
                          <div
                            className="h-2 bg-brand-text"
                            style={{ width: `${Math.round(weight * 100)}%` }}
                          />
                        </div>
                        <span className="text-body-sm text-brand-secondary font-mono w-10 text-right">
                          {Math.round(weight * 100)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Source indicator + refine button */}
            <div className="flex items-center justify-between pt-2 border-t border-brand-border">
              <span className="uppercase-label text-brand-secondary">
                {subtasteSource === 'quiz' ? 'Quiz-validated' : 'Auto-classified'}
              </span>
              {subtasteSource !== 'quiz' && (
                <button
                  onClick={handleConnectSubtaste}
                  disabled={subtasteConnecting}
                  className="text-body-sm text-brand-text underline"
                >
                  {subtasteConnecting ? 'Connecting...' : 'Refine with quiz'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnectSubtaste}
            disabled={subtasteConnecting}
            className="btn-primary w-full"
          >
            {subtasteConnecting ? 'Connecting...' : 'Connect Subtaste'}
          </button>
        )}
      </div>

      {/* Project DNA */}
      <ProjectDNAPanel onScanComplete={handleProjectDnaScanComplete} />

      {/* Lineage Discoveries */}
      <LineageDiscoveries userId="default" projectDnaData={projectDnaData} />

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
          <div className="mt-6 border border-brand-border p-4 space-y-4">
            <p className="uppercase-label text-brand-secondary">Visual DNA</p>

            {/* Style Description */}
            <p className="text-body text-brand-text">
              {clarosaData.visualDNA?.styleDescription}
            </p>

            {/* Art Movements */}
            {clarosaData.visualDNA?.deepAnalysis?.artMovements?.length > 0 && (
              <div>
                <p className="uppercase-label text-brand-secondary mb-2">Art Movements</p>
                <div className="flex flex-wrap gap-2">
                  {clarosaData.visualDNA.deepAnalysis.artMovements.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 border border-brand-border text-body-sm"
                      title={`Affinity: ${Math.round(m.affinity * 100)}%`}
                    >
                      {m.name} <span className="text-brand-secondary font-mono">{Math.round(m.affinity * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Influences */}
            {clarosaData.visualDNA?.deepAnalysis?.influences?.length > 0 && (
              <div>
                <p className="uppercase-label text-brand-secondary mb-2">Influences</p>
                <div className="flex flex-wrap gap-2">
                  {clarosaData.visualDNA.deepAnalysis.influences.map((inf, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 border border-brand-border text-body-sm text-brand-secondary"
                    >
                      {inf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Composition + Visual Era */}
            {clarosaData.visualDNA?.deepAnalysis?.composition && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="uppercase-label text-brand-secondary mb-1">Composition</p>
                  <p className="text-body-sm text-brand-text">
                    {clarosaData.visualDNA.deepAnalysis.composition.symmetry} •{' '}
                    {clarosaData.visualDNA.deepAnalysis.composition.negative_space} space •{' '}
                    {clarosaData.visualDNA.deepAnalysis.composition.complexity} complexity
                  </p>
                </div>
                {clarosaData.visualDNA?.deepAnalysis?.visualEra?.primary && (
                  <div>
                    <p className="uppercase-label text-brand-secondary mb-1">Visual Era</p>
                    <p className="text-body-sm text-brand-text">
                      {clarosaData.visualDNA.deepAnalysis.visualEra.primary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Color Palette */}
            {clarosaData.visualDNA?.colorPalette && clarosaData.visualDNA.colorPalette.length > 0 && (
              <div>
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

            {/* Color Profile from deep analysis */}
            {clarosaData.visualDNA?.deepAnalysis?.colorProfile && (
              <div className="flex gap-4 text-body-sm">
                <span className="text-brand-secondary">
                  Saturation: <span className="text-brand-text">{clarosaData.visualDNA.deepAnalysis.colorProfile.saturation_preference}</span>
                </span>
                <span className="text-brand-secondary">
                  Harmony: <span className="text-brand-text">{clarosaData.visualDNA.deepAnalysis.colorProfile.harmony}</span>
                </span>
                <span className="text-brand-secondary">
                  Temperature: <span className="text-brand-text">{clarosaData.visualDNA.deepAnalysis.colorProfile.temperature}</span>
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="text-body-sm text-brand-secondary pt-2 border-t border-brand-border">
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
        onUploadSuccess={handleUploadSuccess}
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
