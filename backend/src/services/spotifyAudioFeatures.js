const axios = require('axios');

/**
 * Spotify Audio Features Service
 * Gets accurate energy, danceability, valence from Spotify API
 * Use for DJ library tracks (Rekordbox imports) that are likely on Spotify
 */
class SpotifyAudioFeaturesService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get Spotify access token (client credentials flow)
   */
  async getAccessToken() {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify API credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early

      return this.accessToken;
    } catch (error) {
      console.error('Spotify auth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  /**
   * Search for track on Spotify
   */
  async searchTrack(trackTitle, artist = null) {
    const token = await this.getAccessToken();

    // Build search query
    let query = trackTitle;
    if (artist) {
      query += ` artist:${artist}`;
    }

    try {
      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: query,
          type: 'track',
          limit: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.tracks.items.length > 0) {
        return response.data.tracks.items[0];
      }

      return null;
    } catch (error) {
      console.error('Spotify search error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get audio features for a track
   */
  async getAudioFeatures(trackId) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify audio features error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get audio features for a track by title and artist
   */
  async getAudioFeaturesBySearch(trackTitle, artist = null) {
    // Search for track
    const track = await this.searchTrack(trackTitle, artist);
    if (!track) {
      return null;
    }

    // Get audio features
    const features = await this.getAudioFeatures(track.id);
    if (!features) {
      return null;
    }

    return {
      spotifyId: track.id,
      spotifyUri: track.uri,
      name: track.name,
      artist: track.artists[0]?.name,
      // Audio features (what we actually want)
      energy: features.energy, // 0.0 to 1.0
      danceability: features.danceability, // 0.0 to 1.0
      valence: features.valence, // 0.0 to 1.0 (positivity/happiness)
      tempo: features.tempo, // BPM
      loudness: features.loudness, // dB
      acousticness: features.acousticness,
      instrumentalness: features.instrumentalness,
      liveness: features.liveness,
      speechiness: features.speechiness,
      key: this.keyToString(features.key, features.mode),
      timeSignature: features.time_signature,
      // Confidence
      confidence: {
        tempo: features.tempo_confidence || 0.8,
        key: features.key_confidence || 0.8
      },
      source: 'spotify_api'
    };
  }

  /**
   * Convert Spotify key/mode to string format
   */
  keyToString(keyNum, mode) {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (keyNum < 0 || keyNum > 11) return 'Unknown';
    const keyName = keys[keyNum];
    const modeName = mode === 1 ? 'major' : 'minor';
    return `${keyName} ${modeName}`;
  }

  /**
   * Batch process multiple tracks
   * Rate limited to avoid hitting Spotify API limits
   */
  async batchGetAudioFeatures(tracks) {
    const results = [];
    const batchSize = 10;
    const delayMs = 1000; // 1 second between batches

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (track) => {
          try {
            const features = await this.getAudioFeaturesBySearch(
              track.title || track.filename,
              track.artist
            );

            return {
              trackId: track.id,
              features,
              success: features !== null
            };
          } catch (error) {
            return {
              trackId: track.id,
              features: null,
              success: false,
              error: error.message
            };
          }
        })
      );

      results.push(...batchResults);

      // Rate limiting delay
      if (i + batchSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

module.exports = new SpotifyAudioFeaturesService();
