import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

/**
 * Compact, unified audio analysis section
 * Combines: Rekordbox import + File upload + Analysis
 * Aesthetic: Minimal, chic, editorial
 */
const AudioAnalysisCompact = ({ onAnalysisComplete, onRekordboxImport }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'rekordbox'
  const [audioFiles, setAudioFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [rekordboxData, setRekordboxData] = useState(null);
  const [analyzedTracks, setAnalyzedTracks] = useState([]);

  // Audio file upload
  const onAudioDrop = useCallback((acceptedFiles) => {
    setAudioFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onAudioDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
    },
    multiple: true,
    disabled: analyzing
  });

  // Rekordbox XML upload
  const onRekordboxDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('Rekordbox file dropped:', file.name, file.type, file.size);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('xml', file);

      console.log('Sending to /api/audio/rekordbox/import-xml...');
      const response = await axios.post('/api/audio/rekordbox/import-xml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 second timeout for large files
      });

      console.log('Import response:', response.data);

      if (response.data.success) {
        setRekordboxData(response.data.import);
        if (onRekordboxImport) {
          onRekordboxImport(response.data.import);
        }
        alert(`✅ Import successful! ${response.data.import.imported} tracks imported.`);
      } else {
        alert(`❌ Import failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Rekordbox import failed:', error);
      if (error.response) {
        alert(`❌ Server error: ${error.response.data?.error || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        alert('❌ Import timed out. File may be too large.');
      } else {
        alert(`❌ Network error: ${error.message}`);
      }
    } finally {
      setImporting(false);
    }
  }, [onRekordboxImport]);

  const { getRootProps: getRekordboxRootProps, getInputProps: getRekordboxInputProps, isDragActive: isRekordboxDragActive } = useDropzone({
    onDrop: onRekordboxDrop,
    accept: {
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    multiple: false,
    disabled: importing
  });

  // Analyze audio files
  const handleAnalyze = async () => {
    if (audioFiles.length === 0) return;

    setAnalyzing(true);

    try {
      const tracks = [];

      for (const file of audioFiles) {
        const formData = new FormData();
        formData.append('audio', file);

        const response = await axios.post('/api/audio/upload-and-analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          tracks.push(response.data.track);
        }
      }

      setAnalyzedTracks(tracks);

      // Generate DNA
      const analyses = tracks.map(t => t.analysis);
      const dna = {
        totalTracks: analyses.length,
        avgEnergy: analyses.reduce((sum, a) => sum + a.energy, 0) / analyses.length,
        avgValence: analyses.reduce((sum, a) => sum + a.valence, 0) / analyses.length,
        avgBPM: analyses.reduce((sum, a) => sum + a.bpm, 0) / analyses.length,
        avgQuality: analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length,
      };

      setAnalysisResult(dna);

      if (onAnalysisComplete) {
        onAnalysisComplete({ tracks, dna });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeFile = (index) => {
    setAudioFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-display-md mb-2">Audio Analysis</h3>
        <p className="text-body text-brand-secondary">
          Import catalog or upload files for deep analysis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-brand-border">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-1 uppercase-label transition-colors ${
            activeTab === 'upload'
              ? 'border-b-2 border-brand-text text-brand-text'
              : 'text-brand-secondary hover:text-brand-text'
          }`}
        >
          Upload Files
        </button>
        <button
          onClick={() => setActiveTab('rekordbox')}
          className={`pb-3 px-1 uppercase-label transition-colors ${
            activeTab === 'rekordbox'
              ? 'border-b-2 border-brand-text text-brand-text'
              : 'text-brand-secondary hover:text-brand-text'
          }`}
        >
          Rekordbox
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getAudioRootProps()}
            className={`border border-brand-border p-8 text-center cursor-pointer transition-all ${
              isAudioDragActive ? 'border-brand-text bg-brand-bg' : 'hover:border-brand-text'
            } ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getAudioInputProps()} />
            <p className="text-body text-brand-secondary mb-2">
              {isAudioDragActive
                ? 'Drop files here'
                : 'Drag audio files or click to browse'}
            </p>
            <p className="text-body-sm text-brand-secondary">
              MP3, WAV, M4A supported
            </p>
          </div>

          {/* File List */}
          {audioFiles.length > 0 && (
            <div className="space-y-2">
              <p className="uppercase-label text-brand-secondary mb-3">
                {audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''} ready
              </p>
              {audioFiles.slice(0, 5).map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 border border-brand-border"
                >
                  <span className="text-body truncate flex-1">{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-3 text-brand-secondary hover:text-brand-text text-body-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {audioFiles.length > 5 && (
                <p className="text-body-sm text-brand-secondary pl-3">
                  +{audioFiles.length - 5} more
                </p>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={audioFiles.length === 0 || analyzing}
            className="btn-primary w-full"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Audio'}
          </button>

          {/* Analysis Result */}
          {analysisResult && (
            <div className="border border-brand-border p-4 mt-4">
              <p className="uppercase-label text-brand-secondary mb-3">Analysis Complete</p>
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                <div>
                  <span className="text-brand-secondary">Tracks:</span>
                  <span className="ml-2 text-brand-text font-medium">{analysisResult.totalTracks}</span>
                </div>
                <div>
                  <span className="text-brand-secondary">Avg Quality:</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(analysisResult.avgQuality * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">Avg BPM:</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(analysisResult.avgBPM)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">Avg Energy:</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(analysisResult.avgEnergy * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rekordbox Tab */}
      {activeTab === 'rekordbox' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRekordboxRootProps()}
            className={`border border-brand-border p-8 text-center cursor-pointer transition-all ${
              isRekordboxDragActive ? 'border-brand-text bg-brand-bg' : 'hover:border-brand-text'
            } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getRekordboxInputProps()} />
            <p className="text-body text-brand-secondary mb-2">
              {isRekordboxDragActive
                ? 'Drop collection.xml here'
                : importing
                ? 'Importing...'
                : 'Drag collection.xml or click to browse'}
            </p>
            <p className="text-body-sm text-brand-secondary">
              File → Export Collection in xml format
            </p>
          </div>

          {/* Import Result */}
          {rekordboxData && (
            <div className="border border-brand-border p-4">
              <p className="uppercase-label text-brand-secondary mb-3">Import Complete</p>
              <div className="grid grid-cols-2 gap-4 text-body-sm mb-4">
                <div>
                  <span className="text-brand-secondary">Total Tracks:</span>
                  <span className="ml-2 text-brand-text font-medium">{rekordboxData.totalTracks}</span>
                </div>
                <div>
                  <span className="text-brand-secondary">Imported:</span>
                  <span className="ml-2 text-brand-text font-medium">{rekordboxData.imported}</span>
                </div>
                <div>
                  <span className="text-brand-secondary">Total Plays:</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {rekordboxData.stats?.totalPlays?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">Avg Rating:</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round((rekordboxData.stats?.avgRating || 0) * 10) / 10} / 5
                  </span>
                </div>
              </div>

              {/* Top Genres */}
              {rekordboxData.stats?.topGenres && (
                <div className="mt-4">
                  <p className="uppercase-label text-brand-secondary mb-2">Top Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {rekordboxData.stats.topGenres.slice(0, 6).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 border border-brand-border text-body-sm"
                      >
                        {genre.genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Taste Profile */}
              {rekordboxData.tasteProfile && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="uppercase-label text-brand-secondary mb-2">Taste Profile</p>
                  <div className="text-body-sm space-y-1">
                    {rekordboxData.tasteProfile.preferredBpmRange && (
                      <p>
                        <span className="text-brand-secondary">BPM Range:</span>
                        <span className="ml-2 text-brand-text">
                          {Math.round(rekordboxData.tasteProfile.preferredBpmRange.min)}–
                          {Math.round(rekordboxData.tasteProfile.preferredBpmRange.max)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioAnalysisCompact;
