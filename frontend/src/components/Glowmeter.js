import React from 'react';

const Glowmeter = ({ glowLevel, ritualPlan }) => {
  // Calculate capacity based on glow level and ritual plan
  const calculateCapacity = () => {
    if (!ritualPlan) {
      return { level: glowLevel * 20, status: 'baseline', color: 'bg-muted' };
    }

    const baseLoad = ritualPlan.mode === 'full' ? 80 : 40;
    const glowMultiplier = (6 - glowLevel) * 10; // Lower glow = higher load
    const totalLoad = Math.min(100, baseLoad + glowMultiplier);

    let status = 'optimal';
    let color = 'bg-mint';

    if (totalLoad >= 80) {
      status = 'overload';
      color = 'bg-glow';
    } else if (totalLoad >= 60) {
      status = 'moderate';
      color = 'bg-glow';
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl">Glowmeter</h3>
        <span className={`text-sm px-3 py-1 rounded-full ${
          capacity.status === 'overload' ? 'bg-glow text-cosmic' :
          capacity.status === 'moderate' ? 'bg-glow bg-opacity-30 text-glow' :
          'bg-mint bg-opacity-30 text-mint'
        }`}>
          {capacity.status}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="relative h-8 bg-cosmic border border-muted rounded-lg overflow-hidden mb-4">
        <div
          className={`h-full ${capacity.color} transition-all duration-500 ease-out flex items-center justify-end pr-4`}
          style={{ width: `${capacity.level}%` }}
        >
          <span className="text-cosmic text-sm font-bold">
            {capacity.level}%
          </span>
        </div>
      </div>

      {/* Current State */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-muted">Current Glow:</span>
          <span className="ml-2 text-text font-bold">{glowLevel}/5</span>
        </div>
        <div>
          <span className="text-muted">Ritual Mode:</span>
          <span className="ml-2 text-text font-bold">
            {ritualPlan ? (ritualPlan.mode === 'full' ? 'Full Ritual' : 'Low-Energy') : 'None'}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {capacity.status !== 'baseline' && (
        <div className="border-t border-muted pt-4">
          <p className="text-sm text-muted mb-2">Suggestions:</p>
          <ul className="space-y-1">
            {getSuggestions().map((suggestion, idx) => (
              <li key={idx} className="text-sm text-text flex items-start">
                <span className="text-mint mr-2">→</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overload Warning */}
      {capacity.status === 'overload' && (
        <div className="mt-4 p-3 bg-glow bg-opacity-10 border border-glow rounded-lg">
          <p className="text-glow text-sm italic">
            "Overload detected. The Twin suggests reducing scope or extending timeline."
          </p>
        </div>
      )}
    </div>
  );
};

export default Glowmeter;
