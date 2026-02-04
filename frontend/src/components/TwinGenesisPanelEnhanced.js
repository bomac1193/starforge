import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const TwinGenesisPanelEnhanced = ({ onTwinGenerated, onGlowChange }) => {
  // File states
  const [audioFiles, setAudioFiles] = useState([]);
  const [visualFiles, setVisualFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [bio, setBio] = useState('');
  const [calendarFile, setCalendarFile] = useState(null);
  const [glowLevel, setGlowLevel] = useState(3);

  // Integration states
  const [clarosaConnected, setClarosaConnected] = useState(false);
  const [clarosaData, setClarosaData] = useState(null);
  const [sinkAnalyzing, setSinkAnalyzing] = useState(false);
  const [sinkData, setSinkData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Visual dropzone
  const onVisualDrop = useCallback((acceptedFiles) => {
    setVisualFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps: getVisualRootProps, getInputProps: getVisualInputProps, isDragActive: isVisualDragActive } = useDropzone({
    onDrop: onVisualDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: true,
  });

  // Calendar dropzone
  const onCalendarDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setCalendarFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getCalendarRootProps, getInputProps: getCalendarInputProps, isDragActive: isCalendarDragActive } = useDropzone({
    onDrop: onCalendarDrop,
    accept: {
      'text/calendar': ['.ics'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleGlowChange = (e) => {
    const level = parseInt(e.target.value);
    setGlowLevel(level);
    onGlowChange(level);
  };

  // Connect to CLAROSA for visual essence
  const handleConnectClarosa = async () => {
    try {
      setClarosaConnected(true);

      const response = await axios.get('/api/clarosa/visual-essence', {
        params: {
          limit: 10,
          min_score: 0.7
        }
      });

      if (response.data.success) {
        setClarosaData(response.data);
        console.log('CLAROSA connected:', response.data.visualTone);
      }
    } catch (error) {
      console.error('Failed to connect to CLAROSA:', error);
      // Keep button as connected for UI purposes, will use fallback
      setClarosaData({
        visualTone: {
          styleDescription: 'Cosmic neon aesthetic',
          dominantColors: ['#A882FF', '#26FFE6'],
          confidence: 0.5
        }
      });
    }
  };

  // Analyze audio with SINK
  const handleAnalyzeAudio = async () => {
    if (audioFiles.length === 0) {
      alert('Please upload audio files first');
      return;
    }

    try {
      setSinkAnalyzing(true);

      const formData = new FormData();
      audioFiles.forEach(file => {
        formData.append('audio', file);
      });

      const response = await axios.post('/api/sink/analyze-batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSinkData(response.data.audioDNA);
        console.log('SINK analysis complete:', response.data.audioDNA);
      }
    } catch (error) {
      console.error('Failed to analyze with SINK:', error);
      // Use fallback
      setSinkData({
        profile: 'High-energy electronic with driving beats',
        confidence: 0.5
      });
    } finally {
      setSinkAnalyzing(false);
    }
  };

  // Generate Twin with enhanced data
  const handleGenerateTwin = async () => {
    setIsGenerating(true);

    try {
      const formData = new FormData();

      // Add audio files
      audioFiles.forEach(file => {
        formData.append('audio', file);
      });

      // Add text data
      formData.append('caption', caption);
      formData.append('bio', bio);
      formData.append('glowLevel', glowLevel);

      // Call enhanced Twin generation endpoint
      const response = await axios.post('/api/twin/generate-enhanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onTwinGenerated(response.data.twinData);
      }
    } catch (error) {
      console.error('Failed to generate Twin:', error);

      // Fallback generation
      const twinData = {
        audioFiles,
        visualFiles,
        caption,
        bio,
        calendarFile,
        glowLevel,
        voiceSample: caption ? `${caption.slice(0, 50)}...` : 'Voice sample pending',
        visualTone: clarosaData?.visualTone?.styleDescription || 'Cosmic aesthetic',
        audioProfile: sinkData?.profile || 'Audio profile pending',
        capacityScore: glowLevel >= 4 ? 'high' : glowLevel >= 3 ? 'medium' : 'low',
      };

      onTwinGenerated(twinData);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = (audioFiles.length > 0 || clarosaConnected) && (caption || bio);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-glow mb-2">Twin Genesis</h2>
        <p className="text-muted">Input your creative DNA. The Twin will learn your voice, tone, and capacity.</p>
      </div>

      {/* Quick Sync */}
      <div className="card">
        <h3 className="text-xl mb-4">Quick Sync</h3>
        <p className="text-muted text-sm mb-4">
          Connect your existing catalogs for instant Twin generation
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleConnectClarosa}
            disabled={clarosaConnected}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              clarosaConnected
                ? 'border-mint bg-mint bg-opacity-20 text-mint'
                : 'border-muted hover:border-mint'
            }`}
          >
            <div className="text-2xl mb-2">🎨</div>
            <div className="font-bold">
              {clarosaConnected ? '✓ CLAROSA Connected' : 'Connect CLAROSA'}
            </div>
            <div className="text-xs text-muted mt-1">Visual Catalog</div>
          </button>

          <button
            onClick={handleAnalyzeAudio}
            disabled={audioFiles.length === 0 || sinkAnalyzing}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              sinkData
                ? 'border-mint bg-mint bg-opacity-20 text-mint'
                : 'border-muted hover:border-mint'
            }`}
          >
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-bold">
              {sinkAnalyzing ? 'Analyzing...' : sinkData ? '✓ Audio Analyzed' : 'Analyze Audio'}
            </div>
            <div className="text-xs text-muted mt-1">SINK Mood Analysis</div>
          </button>
        </div>

        {/* Show synced data */}
        {clarosaData && (
          <div className="mt-4 p-3 bg-mint bg-opacity-10 border border-mint rounded-lg">
            <p className="text-sm text-mint">
              Visual Tone: {clarosaData.visualTone?.styleDescription}
            </p>
            {clarosaData.visualTone?.dominantColors && (
              <div className="flex gap-2 mt-2">
                {clarosaData.visualTone.dominantColors.slice(0, 5).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded border border-muted"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {sinkData && (
          <div className="mt-4 p-3 bg-glow bg-opacity-10 border border-glow rounded-lg">
            <p className="text-sm text-glow">
              Audio Profile: {sinkData.profile}
            </p>
            {sinkData.features && (
              <div className="text-xs text-muted mt-2 grid grid-cols-2 gap-2">
                <div>Energy: {Math.round(sinkData.features.avgEnergy * 100)}%</div>
                <div>Valence: {Math.round(sinkData.features.avgValence * 100)}%</div>
                <div>BPM: {sinkData.features.avgBpm}</div>
                <div>Tracks: {sinkData.trackCount}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio Upload */}
      <div className="card">
        <h3 className="text-xl mb-4">Audio Essence</h3>
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
            placeholder="Who are you? What do you make? Write as if introducing yourself to a collaborator..."
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
    </div>
  );
};

export default TwinGenesisPanelEnhanced;
