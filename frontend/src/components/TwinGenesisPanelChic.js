import React, { useState } from 'react';
import axios from 'axios';
import AudioAnalysisCompact from './AudioAnalysisCompact';

/**
 * Minimal, chic Twin Genesis Panel
 * No emojis, clean typography, editorial aesthetic
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

  const handleGlowChange = (e) => {
    const level = parseInt(e.target.value);
    setGlowLevel(level);
    onGlowChange(level);
  };

  const handleConnectClarosa = async () => {
    setConnectingClarosa(true);

    try {
      const profileRes = await axios.get('/api/deep/clarosa/profile');
      const photosRes = await axios.get('/api/deep/clarosa/top-photos', {
        params: { limit: 20 }
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-display-lg mb-2">Twin Genesis</h2>
        <p className="text-body text-brand-secondary">
          Connect your creative catalogs. The Twin learns from your actual data.
        </p>
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
            <p className="text-body text-brand-text mb-4">
              {clarosaData.visualDNA?.styleDescription}
            </p>
            <div className="text-body-sm text-brand-secondary">
              {clarosaData.photos?.length || 0} photos analyzed •{' '}
              {clarosaData.profile?.stats?.highlight_count || 0} highlights
            </div>
          </div>
        )}
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
