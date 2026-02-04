const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');

/**
 * SINK Folder Scanner
 * Deep analysis of entire music catalog with pattern recognition
 */
class SinkFolderScanner extends EventEmitter {
  constructor() {
    super();
    this.sinkPath = process.env.SINK_PATH || '/home/sphinxy/SINK';
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
    this.scanResults = [];
    this.isScanning = false;
  }

  /**
   * Scan folder recursively for audio files
   */
  async scanFolder(folderPath, options = {}) {
    const {
      maxDepth = 10,
      maxFiles = 1000,
      skipHidden = true,
      patterns = null // Array of glob patterns to match
    } = options;

    this.isScanning = true;
    this.scanResults = [];

    try {
      const files = await this.findAudioFiles(folderPath, maxDepth, skipHidden);

      // Filter by patterns if provided
      const filteredFiles = patterns
        ? files.filter(f => patterns.some(p => this.matchPattern(f, p)))
        : files;

      // Limit files
      const filesToProcess = filteredFiles.slice(0, maxFiles);

      this.emit('scan-started', {
        totalFiles: filesToProcess.length,
        folder: folderPath
      });

      return filesToProcess;
    } catch (error) {
      this.emit('scan-error', error);
      throw error;
    }
  }

  /**
   * Recursively find all audio files
   */
  async findAudioFiles(dir, maxDepth, skipHidden, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    const audioFiles = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip hidden files/folders if requested
        if (skipHidden && entry.name.startsWith('.')) continue;

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = await this.findAudioFiles(
            fullPath,
            maxDepth,
            skipHidden,
            currentDepth + 1
          );
          audioFiles.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if audio file
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            audioFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }

    return audioFiles;
  }

  /**
   * Analyze batch of audio files with SINK
   */
  async analyzeBatch(files, options = {}) {
    const {
      batchSize = 10,
      parallel = 2,
      includeStems = false
    } = options;

    const results = [];
    this.emit('analysis-started', { totalFiles: files.length });

    // Process in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      // Process batch in parallel (limited concurrency)
      const batchResults = await this.processBatchParallel(
        batch,
        parallel,
        includeStems
      );

      results.push(...batchResults);

      this.emit('batch-complete', {
        processed: results.length,
        total: files.length,
        percentage: Math.round((results.length / files.length) * 100)
      });
    }

    this.scanResults = results;
    this.isScanning = false;

    this.emit('analysis-complete', {
      totalAnalyzed: results.length,
      results: this.generateSummary(results)
    });

    return results;
  }

  /**
   * Process batch with limited parallelism
   */
  async processBatchParallel(files, maxParallel, includeStems) {
    const results = [];
    const chunks = [];

    // Split into parallel chunks
    for (let i = 0; i < files.length; i += maxParallel) {
      chunks.push(files.slice(i, i + maxParallel));
    }

    // Process each chunk in parallel
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(file =>
        this.analyzeSingleFile(file, includeStems)
      );
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Extract successful results
      chunkResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push({
            file: chunk[idx],
            ...result.value
          });
        } else {
          console.error(`Failed to analyze ${chunk[idx]}:`, result.reason);
          results.push({
            file: chunk[idx],
            error: result.reason.message
          });
        }
      });
    }

    return results;
  }

  /**
   * Analyze single file with SINK mood analyzer
   */
  async analyzeSingleFile(filePath, includeStems = false) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        this.sinkPath,
        'audio-processing/processors/mood_analyzer.py'
      );

      const args = [scriptPath, '--file', filePath, '--format', 'json'];

      const pythonProcess = spawn(this.pythonPath, args);
      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Analysis failed: ${errorData}`));
        } else {
          try {
            const analysis = JSON.parse(outputData);

            // Add file metadata
            analysis.fileName = path.basename(filePath);
            analysis.filePath = filePath;
            analysis.fileSize = null; // Will be filled later
            analysis.analyzedAt = new Date().toISOString();

            resolve(analysis);
          } catch (parseError) {
            reject(new Error(`Failed to parse analysis: ${parseError.message}`));
          }
        }
      });
    });
  }

  /**
   * Generate pattern analysis from scan results
   */
  generatePatternAnalysis(results) {
    if (results.length === 0) {
      return { error: 'No results to analyze' };
    }

    // Filter successful analyses
    const validResults = results.filter(r => !r.error && r.energy !== undefined);

    if (validResults.length === 0) {
      return { error: 'No valid analyses' };
    }

    // Calculate distributions
    const patterns = {
      // Energy patterns
      energyDistribution: this.calculateDistribution(validResults, 'energy'),
      avgEnergy: this.average(validResults, 'energy'),

      // Valence patterns
      valenceDistribution: this.calculateDistribution(validResults, 'valence'),
      avgValence: this.average(validResults, 'valence'),

      // Arousal patterns
      arousalDistribution: this.calculateDistribution(validResults, 'arousal'),
      avgArousal: this.average(validResults, 'arousal'),

      // BPM patterns
      bpmDistribution: this.calculateBPMDistribution(validResults),
      avgBPM: this.average(validResults, 'bpm'),
      bpmRange: {
        min: Math.min(...validResults.map(r => r.bpm)),
        max: Math.max(...validResults.map(r => r.bpm))
      },

      // Key distribution
      keyDistribution: this.calculateKeyDistribution(validResults),

      // Mood tag frequency
      moodTagFrequency: this.calculateMoodFrequency(validResults),

      // Temporal patterns (if enough data)
      temporalPatterns: this.analyzeTemporalPatterns(validResults),

      // Style clusters
      styleClusters: this.identifyStyleClusters(validResults),

      // Overall summary
      overallStyle: this.generateStyleSummary(validResults)
    };

    return patterns;
  }

  /**
   * Calculate distribution for a feature
   */
  calculateDistribution(results, feature) {
    const bins = {
      low: 0,      // 0-0.33
      medium: 0,   // 0.33-0.66
      high: 0      // 0.66-1.0
    };

    results.forEach(r => {
      const value = r[feature];
      if (value < 0.33) bins.low++;
      else if (value < 0.66) bins.medium++;
      else bins.high++;
    });

    const total = results.length;
    return {
      low: bins.low / total,
      medium: bins.medium / total,
      high: bins.high / total,
      counts: bins
    };
  }

  /**
   * Calculate BPM distribution
   */
  calculateBPMDistribution(results) {
    const bins = {
      slow: 0,      // < 80
      moderate: 0,  // 80-120
      fast: 0,      // 120-160
      veryFast: 0   // > 160
    };

    results.forEach(r => {
      const bpm = r.bpm;
      if (bpm < 80) bins.slow++;
      else if (bpm < 120) bins.moderate++;
      else if (bpm < 160) bins.fast++;
      else bins.veryFast++;
    });

    return bins;
  }

  /**
   * Calculate key distribution
   */
  calculateKeyDistribution(results) {
    const keyFreq = {};
    results.forEach(r => {
      const key = r.key || 'Unknown';
      keyFreq[key] = (keyFreq[key] || 0) + 1;
    });

    return Object.entries(keyFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));
  }

  /**
   * Calculate mood tag frequency
   */
  calculateMoodFrequency(results) {
    const moodFreq = {};
    results.forEach(r => {
      (r.mood_tags || []).forEach(tag => {
        moodFreq[tag] = (moodFreq[tag] || 0) + 1;
      });
    });

    return Object.entries(moodFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([mood, count]) => ({ mood, count, percentage: count / results.length }));
  }

  /**
   * Identify style clusters using simple k-means
   */
  identifyStyleClusters(results, k = 5) {
    // Extract features for clustering
    const vectors = results.map(r => [
      r.energy || 0,
      r.valence || 0,
      r.arousal || 0,
      (r.bpm || 0) / 200 // Normalize BPM to 0-1
    ]);

    // Simple k-means (placeholder - could use real clustering)
    // For now, just categorize by dominant feature
    const clusters = {
      highEnergy: results.filter(r => r.energy > 0.7),
      chill: results.filter(r => r.energy < 0.3 && r.valence > 0.4),
      dark: results.filter(r => r.valence < 0.3),
      uplifting: results.filter(r => r.valence > 0.7 && r.energy > 0.5),
      ambient: results.filter(r => r.arousal < 0.3)
    };

    return Object.entries(clusters).map(([name, tracks]) => ({
      name,
      count: tracks.length,
      percentage: tracks.length / results.length,
      avgFeatures: {
        energy: this.average(tracks, 'energy'),
        valence: this.average(tracks, 'valence'),
        bpm: this.average(tracks, 'bpm')
      }
    }));
  }

  /**
   * Analyze temporal patterns (track order)
   */
  analyzeTemporalPatterns(results) {
    // Placeholder for more sophisticated analysis
    return {
      totalTracks: results.length,
      analyzed: true
    };
  }

  /**
   * Generate overall style summary
   */
  generateStyleSummary(results) {
    const avg = {
      energy: this.average(results, 'energy'),
      valence: this.average(results, 'valence'),
      bpm: this.average(results, 'bpm')
    };

    const energyLevel = avg.energy > 0.7 ? 'high-energy' :
                       avg.energy > 0.4 ? 'moderate-energy' : 'chill';

    const moodType = avg.valence > 0.6 ? 'uplifting' :
                     avg.valence > 0.4 ? 'neutral' : 'dark';

    const tempoDesc = avg.bpm > 140 ? 'fast-paced' :
                      avg.bpm > 100 ? 'mid-tempo' : 'slow';

    return `${energyLevel} ${moodType} music with ${tempoDesc} rhythms around ${Math.round(avg.bpm)} BPM`;
  }

  /**
   * Helper: Calculate average of a feature
   */
  average(results, feature) {
    const sum = results.reduce((acc, r) => acc + (r[feature] || 0), 0);
    return sum / results.length;
  }

  /**
   * Helper: Match file against pattern
   */
  matchPattern(file, pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(file);
  }

  /**
   * Generate summary report
   */
  generateSummary(results) {
    return {
      totalScanned: results.length,
      successfulAnalyses: results.filter(r => !r.error).length,
      failedAnalyses: results.filter(r => r.error).length,
      patterns: this.generatePatternAnalysis(results)
    };
  }
}

module.exports = new SinkFolderScanner();
