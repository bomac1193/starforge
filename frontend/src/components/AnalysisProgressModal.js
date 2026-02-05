import React from 'react';

/**
 * Modal showing real-time analysis progress
 */
const AnalysisProgressModal = ({
  isOpen,
  onClose,
  type, // 'clarosa' or 'sink'
  progress,
  currentItem,
  items
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'clarosa':
        return '🎨 Connecting to CLAROSA';
      case 'sink':
        return '🎵 Analyzing Audio';
      default:
        return 'Processing...';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'clarosa':
        return 'Loading your visual catalog and extracting taste profile...';
      case 'sink':
        return 'Analyzing mood, energy, BPM, and key for each track...';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-cosmic bg-opacity-90 flex items-center justify-center z-50 animate-fadeIn">
      <div className="card max-w-2xl w-full mx-4 glow-effect">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-glow">{getTitle()}</h3>
          {progress?.percentage === 100 && (
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-muted mb-6">{getDescription()}</p>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">
                {progress.current} / {progress.total}
              </span>
              <span className="text-sm font-bold text-glow">
                {progress.percentage}%
              </span>
            </div>
            <div className="h-3 bg-cosmic border border-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-glow to-mint transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Item */}
        {currentItem && (
          <div className="mb-6 p-4 bg-cosmic border border-muted rounded-lg">
            <div className="text-sm text-muted mb-2">Currently analyzing:</div>
            <div className="font-mono text-sm text-text truncate">
              {currentItem.name || currentItem.path || currentItem.id}
            </div>
            {currentItem.preview && (
              <div className="mt-3">
                {type === 'clarosa' && currentItem.preview.startsWith('data:image') && (
                  <img
                    src={currentItem.preview}
                    alt="Current"
                    className="w-full h-32 object-cover rounded border border-muted"
                  />
                )}
                {type === 'sink' && currentItem.analysis && (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-muted">Energy:</span>
                      <span className="ml-2 text-mint font-bold">
                        {Math.round(currentItem.analysis.energy * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">BPM:</span>
                      <span className="ml-2 text-mint font-bold">
                        {Math.round(currentItem.analysis.bpm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Valence:</span>
                      <span className="ml-2 text-glow font-bold">
                        {Math.round(currentItem.analysis.valence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Key:</span>
                      <span className="ml-2 text-text font-bold">
                        {currentItem.analysis.key}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Items */}
        {items && items.length > 0 && (
          <div>
            <div className="text-sm text-muted mb-3">
              {type === 'clarosa' ? 'Loaded photos:' : 'Analyzed tracks:'}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {items.slice(-5).reverse().map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-cosmic border border-muted rounded text-sm"
                >
                  {type === 'clarosa' && item.preview && (
                    <img
                      src={item.preview}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  {type === 'sink' && (
                    <div className="w-12 h-12 flex items-center justify-center bg-glow bg-opacity-20 rounded">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-text">
                      {item.name || item.fileName || item.id}
                    </div>
                    {item.score !== undefined && (
                      <div className="text-xs text-mint">
                        Score: {Math.round(item.score)}%
                      </div>
                    )}
                    {item.analysis && (
                      <div className="text-xs text-muted">
                        {item.analysis.mood_tags?.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-mint">✓</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div className="mt-6 p-3 bg-glow bg-opacity-10 border border-glow rounded-lg">
          <p className="text-sm text-glow italic">
            {progress?.percentage === 100 ? (
              type === 'clarosa'
                ? `✓ Loaded ${items?.length || 0} photos. Visual DNA extracted.`
                : `✓ Analyzed ${items?.length || 0} tracks. Musical DNA generated.`
            ) : (
              type === 'clarosa'
                ? 'Extracting your visual taste profile...'
                : 'Learning your musical patterns...'
            )}
          </p>
        </div>

        {/* Action Button */}
        {progress?.percentage === 100 && (
          <button
            onClick={onClose}
            className="btn-primary w-full mt-4"
          >
            Continue to Twin Generation
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgressModal;
