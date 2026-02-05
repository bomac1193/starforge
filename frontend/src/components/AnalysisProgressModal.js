import React from 'react';

/**
 * Minimal analysis progress modal
 * Clean, no emojis, editorial aesthetic
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
        return 'Connecting to CLAROSA';
      case 'sink':
        return 'Analyzing Audio';
      default:
        return 'Processing';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'clarosa':
        return 'Loading visual catalog and extracting taste profile';
      case 'sink':
        return 'Analyzing mood, energy, BPM, and key for each track';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg bg-opacity-95 flex items-center justify-center z-50 animate-fadeIn">
      <div className="card max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-display-md">{getTitle()}</h3>
          {progress?.percentage === 100 && (
            <button
              onClick={onClose}
              className="text-brand-secondary hover:text-brand-text transition-colors text-body"
            >
              Close
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-body text-brand-secondary mb-6">{getDescription()}</p>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-body-sm text-brand-secondary">
                {progress.current} / {progress.total}
              </span>
              <span className="text-body-sm text-brand-text font-medium">
                {progress.percentage}%
              </span>
            </div>
            <div className="h-1 bg-brand-border overflow-hidden">
              <div
                className="h-full bg-brand-text transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Item */}
        {currentItem && (
          <div className="mb-6 p-4 border border-brand-border">
            <div className="text-body-sm text-brand-secondary mb-2">Currently analyzing</div>
            <div className="text-body text-brand-text truncate">
              {currentItem.name || currentItem.path || currentItem.id}
            </div>
            {currentItem.preview && type === 'clarosa' && (
              <div className="mt-3">
                <img
                  src={currentItem.preview}
                  alt="Current"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            {type === 'sink' && currentItem.analysis && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-body-sm">
                <div>
                  <span className="text-brand-secondary">Energy</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(currentItem.analysis.energy * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">BPM</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(currentItem.analysis.bpm)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">Valence</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {Math.round(currentItem.analysis.valence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-brand-secondary">Key</span>
                  <span className="ml-2 text-brand-text font-medium">
                    {currentItem.analysis.key}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Items */}
        {items && items.length > 0 && (
          <div>
            <div className="uppercase-label text-brand-secondary mb-3">
              {type === 'clarosa' ? 'Loaded photos' : 'Analyzed tracks'}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {items.slice(-5).reverse().map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 border border-brand-border text-body-sm"
                >
                  {type === 'clarosa' && item.preview && (
                    <img
                      src={item.preview}
                      alt=""
                      className="w-12 h-12 object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-brand-text">
                      {item.name || item.fileName || item.id}
                    </div>
                    {item.score !== undefined && (
                      <div className="text-body-sm text-brand-secondary">
                        Score: {Math.round(item.score)}%
                      </div>
                    )}
                    {item.analysis && (
                      <div className="text-body-sm text-brand-secondary">
                        {item.analysis.mood_tags?.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-brand-text">✓</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div className="mt-6 p-3 border border-brand-border">
          <p className="text-body-sm text-brand-text">
            {progress?.percentage === 100 ? (
              type === 'clarosa'
                ? `Loaded ${items?.length || 0} photos. Visual DNA extracted.`
                : `Analyzed ${items?.length || 0} tracks. Musical DNA generated.`
            ) : (
              type === 'clarosa'
                ? 'Extracting your visual taste profile'
                : 'Learning your musical patterns'
            )}
          </p>
        </div>

        {/* Action Button */}
        {progress?.percentage === 100 && (
          <button
            onClick={onClose}
            className="btn-primary w-full mt-4"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgressModal;
