import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const TwinGenesisPanel = ({ onTwinGenerated, onGlowChange }) => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [visualFiles, setVisualFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [bio, setBio] = useState('');
  const [calendarFile, setCalendarFile] = useState(null);
  const [glowLevel, setGlowLevel] = useState(3);
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

  const handleGenerateTwin = async () => {
    setIsGenerating(true);

    // Simulate processing
    setTimeout(() => {
      const twinData = {
        audioFiles,
        visualFiles,
        caption,
        bio,
        calendarFile,
        glowLevel,
        voiceSample: generateVoiceSample(caption, bio),
        visualTone: generateVisualTone(visualFiles.length),
        capacityScore: calculateCapacity(glowLevel, calendarFile),
      };

      onTwinGenerated(twinData);
      setIsGenerating(false);
    }, 2000);
  };

  const generateVoiceSample = (caption, bio) => {
    return `${caption.slice(0, 50)}... [Voice sample generated from your essence]`;
  };

  const generateVisualTone = (imageCount) => {
    const tones = ['Hyperpop neon dreamscape', 'Minimal cosmic noir', 'Acid-pop maximalism'];
    return tones[imageCount % 3];
  };

  const calculateCapacity = (glow, calendar) => {
    if (glow >= 4) return 'high';
    if (glow === 3) return 'medium';
    return 'low';
  };

  const canGenerate = audioFiles.length > 0 || visualFiles.length > 0 || caption || bio;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-glow mb-2">Twin Genesis</h2>
        <p className="text-muted">Input your creative DNA. The Twin will learn your voice, tone, and capacity.</p>
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

      {/* Visual Moodboard */}
      <div className="card">
        <h3 className="text-xl mb-4">Visual Moodboard</h3>
        <div
          {...getVisualRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isVisualDragActive ? 'border-mint bg-mint bg-opacity-10' : 'border-muted hover:border-mint'
          }`}
        >
          <input {...getVisualInputProps()} />
          <p className="text-muted">
            {isVisualDragActive
              ? 'Drop images here...'
              : 'Drag & drop images (.jpg, .png) or click to browse'}
          </p>
        </div>
        {visualFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {visualFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Visual ${idx + 1}`}
                  className="w-full h-32 object-cover rounded border border-muted"
                />
                <button
                  onClick={() => setVisualFiles(visualFiles.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 bg-cosmic text-muted hover:text-text w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Calendar Sync */}
      <div className="card">
        <h3 className="text-xl mb-4">Calendar Sync</h3>
        <div
          {...getCalendarRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isCalendarDragActive ? 'border-mint bg-mint bg-opacity-10' : 'border-muted hover:border-mint'
          }`}
        >
          <input {...getCalendarInputProps()} />
          <p className="text-muted">
            {isCalendarDragActive
              ? 'Drop calendar file here...'
              : 'Upload .ics or .csv to sync your schedule'}
          </p>
        </div>
        {calendarFile && (
          <div className="mt-4 p-2 bg-cosmic border border-muted rounded">
            <span className="text-sm">📅 {calendarFile.name}</span>
            <button
              onClick={() => setCalendarFile(null)}
              className="ml-4 text-muted hover:text-text"
            >
              ✕
            </button>
          </div>
        )}
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

export default TwinGenesisPanel;
