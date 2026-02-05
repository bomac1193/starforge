import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import AnalysisProgressModal from './AnalysisProgressModal';

const TwinGenesisPanelWithProgress = ({ onTwinGenerated, onGlowChange }) => {
  // File states
  const [audioFiles, setAudioFiles] = useState([]);
  const [visualFiles, setVisualFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [bio, setBio] = useState('');
  const [calendarFile, setCalendarFile] = useState(null);
  const [glowLevel, setGlowLevel] = useState(3);

  // Integration states
  const [clarosaData, setClarosaData] = useState(null);
  const [sinkData, setSinkData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Progress modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalProgress, setModalProgress] = useState(null);
  const [modalCurrentItem, setModalCurrentItem] = useState(null);
  const [modalItems, setModalItems] = useState([]);

  // Audio dropzone
  const onAudioDrop = useCallback((acceptedFiles) => {
    setAudioFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onAudioDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
    },
    multiple: true,
  });

  const handleGlowChange = (e) => {
    const level = parseInt(e.target.value);
    setGlowLevel(level);
    onGlowChange(level);
  };

  // Connect to CLAROSA with progress modal
  const handleConnectClarosa = async () => {
    setShowModal(true);
    setModalType('clarosa');
    setModalProgress({ current: 0, total: 100, percentage: 0 });
    setModalItems([]);

    try {
      // Step 1: Get profile (10%)
      setModalProgress({ current: 10, total: 100, percentage: 10 });
      setModalCurrentItem({ name: 'Loading profile...', id: 'profile' });

      const profileRes = await axios.get('/api/deep/clarosa/profile');

      // Step 2: Get top photos (20-80%)
      setModalProgress({ current: 20, total: 100, percentage: 20 });
      setModalCurrentItem({ name: 'Loading top-rated photos...', id: 'photos' });

      const photosRes = await axios.get('/api/deep/clarosa/top-photos', {
        params: { limit: 20 }
      });

      // Simulate loading each photo
      const photos = photosRes.data.photos || [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setModalProgress({
          current: 20 + i,
          total: 20 + photos.length,
          percentage: Math.round((20 + i) / (20 + photos.length) * 100)
        });
        setModalCurrentItem({
          name: photo.file_path.split('/').pop(),
          id: photo.id,
          preview: `http://localhost:5000${photo.file_url}`,
          score: photo.clarosa_score
        });
        setModalItems(prev => [...prev, {
          name: photo.file_path.split('/').pop(),
          id: photo.id,
          preview: `http://localhost:5000${photo.file_url}`,
          score: photo.clarosa_score
        }]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 3: Extract visual DNA (80-100%)
      setModalProgress({ current: 80, total: 100, percentage: 80 });
      setModalCurrentItem({ name: 'Extracting visual DNA...', id: 'dna' });

      const dnaRes = await axios.get('/api/deep/clarosa/visual-dna');

      setModalProgress({ current: 100, total: 100, percentage: 100 });
      setModalCurrentItem(null);

      setClarosaData({
        profile: profileRes.data.profile,
        photos: photosRes.data.photos,
        visualDNA: dnaRes.data.visualDNA
      });

      console.log('CLAROSA connected:', dnaRes.data.visualDNA);
    } catch (error) {
      console.error('Failed to connect to CLAROSA:', error);
      setModalProgress({ current: 100, total: 100, percentage: 100 });
      setClarosaData({
        error: true,
        visualDNA: {
          styleDescription: 'Connection failed - using fallback',
          confidence: 0
        }
      });
    }
  };

  // Analyze audio with progress modal
  const handleAnalyzeAudio = async () => {
    if (audioFiles.length === 0) {
      alert('Please upload audio files first');
      return;
    }

    setShowModal(true);
    setModalType('sink');
    setModalProgress({ current: 0, total: audioFiles.length, percentage: 0 });
    setModalItems([]);

    try {
      const analyses = [];

      // Analyze each file with progress
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];

        setModalProgress({
          current: i,
          total: audioFiles.length,
          percentage: Math.round((i / audioFiles.length) * 100)
        });

        setModalCurrentItem({
          name: file.name,
          path: file.path
        });

        const formData = new FormData();
        formData.append('audio', file);

        try {
          const response = await axios.post('/api/sink/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data.success) {
            const analysis = response.data.analysis;
            analyses.push(analysis);

            setModalCurrentItem({
              name: file.name,
              path: file.path,
              analysis
            });

            setModalItems(prev => [...prev, {
              fileName: file.name,
              analysis
            }]);

            // Pause to show result
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to analyze ${file.name}:`, error);
        }
      }

      setModalProgress({
        current: audioFiles.length,
        total: audioFiles.length,
        percentage: 100
      });

      // Generate audio DNA from analyses
      const audioDNA = {
        totalTracks: analyses.length,
        avgEnergy: analyses.reduce((sum, a) => sum + a.energy, 0) / analyses.length,
        avgValence: analyses.reduce((sum, a) => sum + a.valence, 0) / analyses.length,
        avgBPM: analyses.reduce((sum, a) => sum + a.bpm, 0) / analyses.length,
        dominantMoods: [...new Set(analyses.flatMap(a => a.mood_tags))].slice(0, 5),
        profile: `Audio DNA from ${analyses.length} tracks`
      };

      setSinkData(audioDNA);
      console.log('SINK analysis complete:', audioDNA);
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      setModalProgress({ current: audioFiles.length, total: audioFiles.length, percentage: 100 });
    }
  };

  const handleGenerateTwin = async () => {
    setShowModal(false);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      audioFiles.forEach(file => formData.append('audio', file));
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
          sinkData
        });
      }
    } catch (error) {
      console.error('Failed to generate Twin:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = (audioFiles.length > 0 || clarosaData) && (caption || bio);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-glow mb-2">Twin Genesis</h2>
        <p className="text-muted">Connect your creative catalogs. The Twin will learn from your real data.</p>
      </div>

      {/* Quick Sync */}
      <div className="card">
        <h3 className="text-xl mb-4">Quick Sync</h3>
        <p className="text-muted text-sm mb-4">
          Direct access to your CLAROSA photos and SINK audio analysis
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleConnectClarosa}
            disabled={clarosaData && !clarosaData.error}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              clarosaData && !clarosaData.error
                ? 'border-mint bg-mint bg-opacity-20 text-mint'
                : 'border-muted hover:border-mint'
            }`}
          >
            <div className="text-2xl mb-2">🎨</div>
            <div className="font-bold">
              {clarosaData && !clarosaData.error ? '✓ CLAROSA Connected' : 'Connect CLAROSA'}
            </div>
            <div className="text-xs text-muted mt-1">
              {clarosaData && !clarosaData.error
                ? `${clarosaData.photos?.length || 0} photos loaded`
                : 'Visual Catalog'}
            </div>
          </button>

          <button
            onClick={handleAnalyzeAudio}
            disabled={audioFiles.length === 0}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              sinkData
                ? 'border-mint bg-mint bg-opacity-20 text-mint'
                : audioFiles.length === 0
                ? 'border-muted opacity-50 cursor-not-allowed'
                : 'border-muted hover:border-mint'
            }`}
          >
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-bold">
              {sinkData ? '✓ Audio Analyzed' : 'Analyze Audio'}
            </div>
            <div className="text-xs text-muted mt-1">
              {sinkData
                ? `${sinkData.totalTracks} tracks analyzed`
                : `${audioFiles.length} files uploaded`}
            </div>
          </button>
        </div>

        {/* Results Display */}
        {clarosaData && !clarosaData.error && (
          <div className="mt-4 p-4 bg-mint bg-opacity-10 border border-mint rounded-lg">
            <div className="text-sm font-bold text-mint mb-2">Visual DNA</div>
            <p className="text-sm text-text mb-3">
              {clarosaData.visualDNA?.styleDescription}
            </p>
            <div className="text-xs text-muted">
              {clarosaData.photos?.length || 0} photos • {clarosaData.profile?.stats?.highlight_count || 0} highlights
            </div>
          </div>
        )}

        {sinkData && (
          <div className="mt-4 p-4 bg-glow bg-opacity-10 border border-glow rounded-lg">
            <div className="text-sm font-bold text-glow mb-2">Audio DNA</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted">Energy:</span>
                <span className="ml-2 text-text font-bold">
                  {Math.round(sinkData.avgEnergy * 100)}%
                </span>
              </div>
              <div>
                <span className="text-muted">BPM:</span>
                <span className="ml-2 text-text font-bold">
                  {Math.round(sinkData.avgBPM)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted">Moods:</span>
                <span className="ml-2 text-text">
                  {sinkData.dominantMoods?.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio Upload */}
      <div className="card">
        <h3 className="text-xl mb-4">Audio Files</h3>
        <div
          {...getAudioRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isAudioDragActive ? 'border-glow bg-glow bg-opacity-10' : 'border-muted hover:border-glow'
          }`}
        >
          <input {...getAudioInputProps()} />
          <p className="text-muted">
            {isAudioDragActive
              ? 'Drop audio files here...'
              : 'Drag & drop audio files (.mp3, .wav) or click to browse'}
          </p>
        </div>
        {audioFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {audioFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-cosmic border border-muted rounded">
                <span className="text-sm">🎵 {file.name}</span>
                <button
                  onClick={() => setAudioFiles(audioFiles.filter((_, i) => i !== idx))}
                  className="text-muted hover:text-text"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caption & Bio */}
      <div className="card space-y-4">
        <h3 className="text-xl">Voice & Identity</h3>
        <div>
          <label className="block text-sm text-muted mb-2">Caption Sample</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="How do you caption your work? Drop an example..."
            className="input-field h-24 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-2">Bio / Artist Statement</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Who are you? What do you make?"
            className="input-field h-32 resize-none"
          />
        </div>
      </div>

      {/* Glow Check */}
      <div className="card">
        <h3 className="text-xl mb-4">Glow Check</h3>
        <p className="text-muted text-sm mb-4">How's your energy today?</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">Low</span>
          <input
            type="range"
            min="1"
            max="5"
            value={glowLevel}
            onChange={handleGlowChange}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-glow"
          />
          <span className="text-sm text-muted">High</span>
        </div>
        <div className="mt-4 text-center">
          <span className={`text-2xl font-bold ${glowLevel >= 4 ? 'text-mint' : glowLevel >= 3 ? 'text-glow' : 'text-muted'}`}>
            {glowLevel}/5
          </span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateTwin}
        disabled={!canGenerate || isGenerating}
        className={`btn-primary w-full text-lg py-4 ${
          !canGenerate || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isGenerating ? 'Forging Twin...' : 'Generate Twin OS'}
      </button>

      {/* Progress Modal */}
      <AnalysisProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        progress={modalProgress}
        currentItem={modalCurrentItem}
        items={modalItems}
      />
    </div>
  );
};

export default TwinGenesisPanelWithProgress;
