import React from 'react';

const Glowmeter = ({ glowLevel, ritualPlan }) => {
  // Calculate capacity based on glow level and ritual plan
  const calculateCapacity = () => {
    if (!ritualPlan) {
      return { level: glowLevel * 20, status: 'baseline', color: 'bg-brand-secondary' };
    }

    const baseLoad = ritualPlan.mode === 'full' ? 80 : 40;
    const glowMultiplier = (6 - glowLevel) * 10; // Lower glow = higher load
    const totalLoad = Math.min(100, baseLoad + glowMultiplier);

    let status = 'optimal';
    let color = 'bg-brand-text';

    if (totalLoad >= 80) {
      status = 'overload';
      color = 'bg-brand-text';
    } else if (totalLoad >= 60) {
      status = 'moderate';
      color = 'bg-brand-accent';
    }

    return { level: totalLoad, status, color };
  };

  const capacity = calculateCapacity();

  const getSuggestions = () => {
    if (capacity.status === 'overload') {
      return [
        'Consider switching to Low-Energy Mode',
        'Delay non-essential content',
        'Compress ritual timeline',
      ];
    }
    if (capacity.status === 'moderate') {
      return ['Monitor your energy closely', 'Keep buffers in schedule'];
    }
    return ['Capacity looks good. Ready to forge.'];
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-display-md">Energy Capacity</h3>
        <span className={`uppercase-label px-3 py-1 border ${
          capacity.status === 'overload' ? 'border-brand-text text-brand-text' :
          capacity.status === 'moderate' ? 'border-brand-accent text-brand-accent' :
          'border-brand-border text-brand-secondary'
        }`}>
          {capacity.status}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="relative h-2 bg-brand-border overflow-hidden mb-6">
        <div
          className={`h-full ${capacity.color} transition-all duration-500 ease-out`}
          style={{ width: `${capacity.level}%` }}
        />
      </div>
      <p className="text-body-sm text-brand-secondary text-right mb-6">{capacity.level}%</p>

      {/* Current State */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-body-sm">
        <div>
          <span className="text-brand-secondary">Current Energy</span>
          <span className="ml-2 text-brand-text font-medium">{glowLevel}/5</span>
        </div>
        <div>
          <span className="text-brand-secondary">Ritual Mode</span>
          <span className="ml-2 text-brand-text font-medium">
            {ritualPlan ? (ritualPlan.mode === 'full' ? 'Full Ritual' : 'Low-Energy') : 'None'}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {capacity.status !== 'baseline' && (
        <div className="border-t border-brand-border pt-4">
          <p className="uppercase-label text-brand-secondary mb-3">Recommendations</p>
          <ul className="space-y-2">
            {getSuggestions().map((suggestion, idx) => (
              <li key={idx} className="text-body-sm text-brand-text">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overload Warning */}
      {capacity.status === 'overload' && (
        <div className="mt-6 p-4 border border-brand-text">
          <p className="text-body-sm text-brand-text italic">
            Overload detected. The Twin suggests reducing scope or extending timeline.
          </p>
        </div>
      )}
    </div>
  );
};

export default Glowmeter;
