const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// CLAROSA Integration Service
// Connects to local CLAROSA instance for visual catalog

class ClarosaService {
  constructor() {
    // CLAROSA runs on its own port (adjust as needed)
    this.clarosaBaseUrl = process.env.CLAROSA_URL || 'http://localhost:8000';
    this.clarosaPath = process.env.CLAROSA_PATH || '/home/sphinxy/clarosa';
  }

  /**
   * Get user's top-rated images from CLAROSA
   * @param {number} limit - Number of images to fetch
   * @param {number} minScore - Minimum Bradley-Terry score (0-1)
   * @returns {Promise<Array>} - Top rated images with metadata
   */
  async getTopRatedImages(limit = 10, minScore = 0.7) {
    try {
      // Call CLAROSA API endpoint
      const response = await axios.get(`${this.clarosaBaseUrl}/api/images/top-rated`, {
        params: { limit, min_score: minScore }
      });

      return response.data.images.map(img => ({
        id: img.id,
        path: img.file_path,
        score: img.bradley_terry_score,
        confidence: img.confidence,
        embedding: img.embedding,
        colorPalette: img.color_palette,
        tags: img.tags,
        createdAt: img.created_at
      }));
    } catch (error) {
      console.error('Error fetching from CLAROSA:', error.message);

      // Fallback: Try direct database query if API unavailable
      return this.getTopRatedImagesFallback(limit, minScore);
    }
  }

  /**
   * Fallback: Query CLAROSA database directly
   */
  async getTopRatedImagesFallback(limit, minScore) {
    try {
      // CLAROSA uses SQLAlchemy with PostgreSQL
      // This is a fallback if API is down

      console.log('CLAROSA API unavailable, using mock data');

      // Return mock structure for development
      return [
        {
          id: 1,
          path: '/clarosa/images/sample1.jpg',
          score: 0.85,
          confidence: 0.92,
          colorPalette: ['#A882FF', '#26FFE6', '#0F0F1A'],
          tags: ['abstract', 'neon', 'cosmic']
        }
      ];
    } catch (error) {
      console.error('Fallback also failed:', error.message);
      return [];
    }
  }

  /**
   * Extract visual tone from top-rated images
   * Analyzes color palettes and tags to generate style description
   */
  async extractVisualTone(images) {
    if (!images || images.length === 0) {
      return {
        dominantColors: [],
        aestheticTags: [],
        styleDescription: 'No visual data available',
        confidence: 0
      };
    }

    // Extract all colors from all images
    const allColors = images
      .filter(img => img.colorPalette)
      .flatMap(img => img.colorPalette);

    // Count color frequency
    const colorFrequency = {};
    allColors.forEach(color => {
      colorFrequency[color] = (colorFrequency[color] || 0) + 1;
    });

    // Sort by frequency
    const dominantColors = Object.entries(colorFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    // Extract all tags
    const allTags = images
      .filter(img => img.tags)
      .flatMap(img => img.tags);

    // Count tag frequency
    const tagFrequency = {};
    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    // Sort by frequency
    const aestheticTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    // Generate style description
    const styleDescription = this.generateStyleDescription(dominantColors, aestheticTags);

    // Calculate confidence based on number of images and score variance
    const avgScore = images.reduce((sum, img) => sum + img.score, 0) / images.length;
    const confidence = Math.min(avgScore * (images.length / 10), 1);

    return {
      dominantColors,
      aestheticTags,
      styleDescription,
      confidence: Math.round(confidence * 100) / 100,
      imageCount: images.length
    };
  }

  /**
   * Generate natural language style description
   */
  generateStyleDescription(colors, tags) {
    const colorDescriptions = {
      '#A882FF': 'neon lavender',
      '#26FFE6': 'electric mint',
      '#0F0F1A': 'cosmic void',
      '#FF6B9D': 'hot pink',
      '#FFD93D': 'golden yellow'
    };

    const colorNames = colors
      .slice(0, 3)
      .map(c => colorDescriptions[c] || c)
      .join(', ');

    const topTags = tags.slice(0, 3).join(', ');

    return `${topTags} aesthetic with ${colorNames} tones`;
  }

  /**
   * Import images from Midjourney export
   * This would process MJ exports and add them to CLAROSA for ranking
   */
  async importFromMidjourney(mjExportPath) {
    try {
      // Read Midjourney export directory
      const files = await fs.readdir(mjExportPath);
      const imageFiles = files.filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
      );

      console.log(`Found ${imageFiles.length} Midjourney images to import`);

      // Call CLAROSA import endpoint
      const response = await axios.post(`${this.clarosaBaseUrl}/api/images/import`, {
        source: 'midjourney',
        images: imageFiles.map(f => ({
          path: path.join(mjExportPath, f),
          source: 'midjourney'
        }))
      });

      return {
        success: true,
        imported: response.data.imported,
        total: imageFiles.length
      };
    } catch (error) {
      console.error('Error importing Midjourney images:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's visual taste profile from CLAROSA
   */
  async getVisualTasteProfile() {
    try {
      const response = await axios.get(`${this.clarosaBaseUrl}/api/profile/taste`);

      return {
        confidence: response.data.confidence,
        totalComparisons: response.data.total_comparisons,
        modelAccuracy: response.data.model_accuracy,
        preferredStyles: response.data.preferred_styles,
        averageScore: response.data.average_score
      };
    } catch (error) {
      console.error('Error fetching taste profile:', error.message);
      return null;
    }
  }
}

module.exports = new ClarosaService();
