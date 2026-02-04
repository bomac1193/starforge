import React, { useState } from 'react';

const Glowline = ({ ritualPlan }) => {
  const [selectedPhase, setSelectedPhase] = useState(null);

  if (!ritualPlan) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted">No ritual plan generated yet.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getPhaseStatus = (phaseDate) => {
    const date = new Date(phaseDate);
    date.setHours(0, 0, 0, 0);

    if (date < today) return 'completed';
    if (date.getTime() === today.getTime()) return 'active';
    return 'upcoming';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-mint mb-2">Glowline</h2>
        <p className="text-muted">
          Your campaign timeline for <span className="text-text font-bold">{ritualPlan.trackName}</span>
        </p>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted"></div>

        {/* Phases */}
        <div className="space-y-8">
          {ritualPlan.timeline.map((phase, idx) => {
            const status = getPhaseStatus(phase.date);
            const isSelected = selectedPhase === idx;

            return (
              <div key={idx} className="relative pl-20">
                {/* Status indicator */}
                <div
                  className={`absolute left-5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    status === 'completed'
                      ? 'bg-mint border-mint'
                      : status === 'active'
                      ? 'bg-glow border-glow glow-effect'
                      : 'bg-cosmic border-muted'
                  }`}
                >
                  {status === 'completed' && (
                    <span className="text-cosmic text-xs">✓</span>
                  )}
                  {status === 'active' && (
                    <span className="text-cosmic text-xs">●</span>
                  )}
                </div>

                {/* Phase card */}
                <div
                  className={`card cursor-pointer transition-all ${
                    isSelected ? 'border-glow glow-effect' : ''
                  } ${status === 'active' ? 'border-glow' : ''}`}
                  onClick={() => setSelectedPhase(isSelected ? null : idx)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold capitalize text-glow">
                        {phase.name}
                      </h3>
                      <p className="text-sm text-muted mt-1">
                        {phase.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        status === 'completed'
                          ? 'bg-mint text-cosmic'
                          : status === 'active'
                          ? 'bg-glow text-cosmic'
                          : 'bg-muted text-text'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Assets checklist */}
                  <div className="mb-4">
                    <p className="text-sm text-muted mb-2">Assets:</p>
                    <div className="space-y-2">
                      {phase.assets.map((asset, i) => (
                        <label key={i} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-muted text-mint focus:ring-glow"
                            defaultChecked={status === 'completed'}
                          />
                          <span className="ml-3 text-sm group-hover:text-glow transition-colors">
                            {asset}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Copy preview */}
                  {isSelected && (
                    <div className="border-t border-muted pt-4 mt-4">
                      <p className="text-sm text-muted mb-2">Generated Copy:</p>
                      <div className="bg-cosmic border border-muted rounded-lg p-4">
                        <p className="text-sm italic">{phase.copy}</p>
                      </div>
                    </div>
                  )}

                  {/* Expand indicator */}
                  <button className="text-xs text-muted hover:text-text mt-2 w-full text-center">
                    {isSelected ? 'Collapse ▲' : 'View Details ▼'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card">
        <h3 className="text-xl mb-4">Campaign Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-mint">
              {ritualPlan.timeline.filter(p => getPhaseStatus(p.date) === 'completed').length}
            </div>
            <div className="text-sm text-muted mt-1">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-glow">
              {ritualPlan.timeline.filter(p => getPhaseStatus(p.date) === 'active').length}
            </div>
            <div className="text-sm text-muted mt-1">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted">
              {ritualPlan.timeline.filter(p => getPhaseStatus(p.date) === 'upcoming').length}
            </div>
            <div className="text-sm text-muted mt-1">Upcoming</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Glowline;
