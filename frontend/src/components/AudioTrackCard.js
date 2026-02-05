import React, { useState } from 'react';
import axios from 'axios';

/**
 * Audio Track Card with ratings, quality score, and highlights
 */
const AudioTrackCard = ({ track, onRatingChange }) => {
  const [rating, setRating] = useState(track.star_rating || 0);
  const [thumbs, setThumbs] = useState(track.thumbs || 0);
  const [showHighlights, setShowHighlights] = useState(false);

  const handleStarRating = async (newRating) => {
    try {
      const response = await axios.post(`/api/audio/rate/${track.id}`, {
        rating: newRating
      });

      if (response.data.success) {
        setRating(newRating);
        if (onRatingChange) {
          onRatingChange(track.id, newRating);
        }
      }
    } catch (error) {
      console.error('Failed to rate track:', error);
    }
  };

  const handleThumbsVote = async (vote) => {
    try {
      const response = await axios.post(`/api/audio/rate/${track.id}`, {
        vote
      });

      if (response.data.success) {
        setThumbs(vote);
        if (onRatingChange) {
          onRatingChange(track.id, vote);
        }
      }
    } catch (error) {
      console.error('Failed to vote on track:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'text-mint';
    if (score >= 0.6) return 'text-glow';
    return 'text-muted';
  };

  const getQualityLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="card hover:border-glow transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-text truncate">{track.filename}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            <span>⏱ {formatTime(track.duration_seconds || 0)}</span>
            {track.bpm > 0 && <span>🎵 {Math.round(track.bpm)} BPM</span>}
            {track.key && <span>🎹 {track.key}</span>}
          </div>
        </div>

        {/* Quality Score */}
        {track.quality_score !== undefined && (
          <div className="text-right ml-3">
            <div className={`text-2xl font-bold ${getQualityColor(track.quality_score)}`}>
              {Math.round(track.quality_score * 100)}%
            </div>
            <div className="text-xs text-muted">{getQualityLabel(track.quality_score)}</div>
          </div>
        )}
      </div>

      {/* Audio Features */}
      {(track.energy !== undefined || track.valence !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {track.energy !== undefined && (
            <div className="p-2 bg-cosmic rounded">
              <div className="text-xs text-muted mb-1">Energy</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mint transition-all"
                    style={{ width: `${track.energy * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text">{Math.round(track.energy * 100)}%</span>
              </div>
            </div>
          )}

          {track.valence !== undefined && (
            <div className="p-2 bg-cosmic rounded">
              <div className="text-xs text-muted mb-1">Valence</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-glow transition-all"
                    style={{ width: `${track.valence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text">{Math.round(track.valence * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Section */}
      <div className="flex items-center justify-between py-3 border-t border-muted">
        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarRating(star)}
              className={`text-xl transition-all ${
                star <= rating ? 'text-glow' : 'text-muted hover:text-glow'
              }`}
            >
              ⭐
            </button>
          ))}
        </div>

        {/* Thumbs Up/Down */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleThumbsVote(thumbs === 1 ? 0 : 1)}
            className={`px-3 py-1 rounded transition-all ${
              thumbs === 1
                ? 'bg-mint text-cosmic'
                : 'bg-cosmic border border-muted text-muted hover:border-mint hover:text-mint'
            }`}
          >
            👍
          </button>
          <button
            onClick={() => handleThumbsVote(thumbs === -1 ? 0 : -1)}
            className={`px-3 py-1 rounded transition-all ${
              thumbs === -1
                ? 'bg-red-500 text-white'
                : 'bg-cosmic border border-muted text-muted hover:border-red-500 hover:text-red-500'
            }`}
          >
            👎
          </button>
        </div>
      </div>

      {/* Highlights Section */}
      {track.highlights && track.highlights.length > 0 && (
        <div className="mt-3 pt-3 border-t border-muted">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="flex items-center justify-between w-full text-sm text-glow hover:text-mint transition-colors"
          >
            <span>✨ {track.highlights.length} Best Moments</span>
            <span>{showHighlights ? '▼' : '▶'}</span>
          </button>

          {showHighlights && (
            <div className="mt-3 space-y-2">
              {track.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-cosmic border border-muted rounded flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="text-xs text-text">
                      {formatTime(highlight.start_seconds)} - {formatTime(highlight.end_seconds)}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {highlight.reason.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="text-xs text-mint">
                      {Math.round(highlight.highlight_score * 100)}%
                    </div>
                    <button className="text-glow hover:text-mint transition-colors">
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rekordbox Data */}
      {track.source === 'rekordbox' && track.rekordbox_play_count > 0 && (
        <div className="mt-3 pt-3 border-t border-muted">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>📀 Rekordbox:</span>
            <span>{track.rekordbox_play_count} plays</span>
            {track.rekordbox_color && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: track.rekordbox_color }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTrackCard;
