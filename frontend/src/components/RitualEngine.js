import React, { useState } from 'react';

const RitualEngine = ({ twinData, glowLevel, onRitualCreated }) => {
  const [trackName, setTrackName] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [ritualMode, setRitualMode] = useState('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const handleGenerateRitual = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const plan = generateRitualPlan(trackName, dropDate, ritualMode, twinData, glowLevel);
      setGeneratedPlan(plan);
      onRitualCreated(plan);
      setIsGenerating(false);
    }, 1500);
  };

  const generateRitualPlan = (track, date, mode, twin, glow) => {
    const dropDateObj = new Date(date);

    const phases = mode === 'full'
      ? [
          { name: 'tease', offset: -14, assets: ['Snippet video', 'Cryptic caption', 'Story teaser'] },
          { name: 'announce', offset: -7, assets: ['Cover reveal', 'Full caption', 'Pre-save link'] },
          { name: 'drop', offset: 0, assets: ['Full track', 'Music video', 'Press kit'] },
          { name: 'follow-up', offset: 3, assets: ['BTS content', 'Remix stems', 'Thank you post'] },
        ]
      : [
          { name: 'announce', offset: -3, assets: ['Cover reveal', 'Simple caption'] },
          { name: 'drop', offset: 0, assets: ['Full track', 'Short video'] },
        ];

    const timeline = phases.map(phase => ({
      ...phase,
      date: new Date(dropDateObj.getTime() + phase.offset * 24 * 60 * 60 * 1000),
      copy: generateCopy(phase.name, track, twin),
    }));

    return {
      trackName: track,
      dropDate: date,
      mode,
      timeline,
      capacity: glow >= 3 ? 'sufficient' : 'compressed',
    };
  };

  const generateCopy = (phase, track, twin) => {
    const samples = {
      tease: `Something's coming. ${track ? `"${track}"` : 'New frequencies'}.`,
      announce: `${track} drops soon. Link in bio. You ready?`,
      drop: `${track} is out now. Everywhere. Go listen.`,
      'follow-up': `Thank you for the energy on ${track}. More coming.`,
    };

    return twin?.caption
      ? `${samples[phase]} [Auto-generated in your voice]`
      : samples[phase];
  };

  const canGenerate = trackName && dropDate;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-mint mb-2">Ritual Engine</h2>
        <p className="text-muted">Plan your drop without the panic. The Twin handles the timeline.</p>
      </div>

      {/* Input Section */}
      {!generatedPlan && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl mb-4">Drop Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-2">Track Name</label>
                <input
                  type="text"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="What are you dropping?"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-2">Target Drop Date</label>
                <input
                  type="date"
                  value={dropDate}
                  onChange={(e) => setDropDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl mb-4">Ritual Mode</h3>
            <div className="space-y-3">
              <button
                onClick={() => setRitualMode('full')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  ritualMode === 'full'
                    ? 'border-glow bg-glow bg-opacity-10'
                    : 'border-muted hover:border-glow'
                }`}
              >
                <div className="font-bold text-glow mb-1">Full Ritual</div>
                <div className="text-sm text-muted">
                  4-phase campaign: Tease → Announce → Drop → Follow-up
                </div>
              </button>
              <button
                onClick={() => setRitualMode('low-energy')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  ritualMode === 'low-energy'
                    ? 'border-mint bg-mint bg-opacity-10'
                    : 'border-muted hover:border-mint'
                }`}
              >
                <div className="font-bold text-mint mb-1">Low-Energy Mode</div>
                <div className="text-sm text-muted">
                  Compressed: Announce → Drop (for when glow is low)
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerateRitual}
            disabled={!canGenerate || isGenerating}
            className={`btn-primary w-full text-lg py-4 ${
              !canGenerate || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? 'Forging Ritual...' : 'Generate Campaign'}
          </button>
        </div>
      )}

      {/* Generated Plan */}
      {generatedPlan && (
        <div className="space-y-6">
          <div className="card border-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-glow">Campaign: {generatedPlan.trackName}</h3>
              <button
                onClick={() => setGeneratedPlan(null)}
                className="text-sm text-muted hover:text-text"
              >
                Edit Plan
              </button>
            </div>

            <div className="space-y-1 text-sm mb-6">
              <div>
                <span className="text-muted">Drop Date:</span>
                <span className="ml-2 text-text font-bold">
                  {new Date(generatedPlan.dropDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted">Mode:</span>
                <span className="ml-2 text-text font-bold">
                  {generatedPlan.mode === 'full' ? 'Full Ritual' : 'Low-Energy'}
                </span>
              </div>
              <div>
                <span className="text-muted">Capacity:</span>
                <span className={`ml-2 font-bold ${
                  generatedPlan.capacity === 'sufficient' ? 'text-mint' : 'text-glow'
                }`}>
                  {generatedPlan.capacity}
                </span>
              </div>
            </div>

            {/* Timeline Preview */}
            <div className="space-y-4">
              {generatedPlan.timeline.map((phase, idx) => (
                <div key={idx} className="border border-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-glow capitalize">{phase.name}</span>
                    <span className="text-sm text-muted">
                      {phase.date.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted mb-3">Assets:</div>
                  <ul className="space-y-1 mb-3">
                    {phase.assets.map((asset, i) => (
                      <li key={i} className="text-sm flex items-center">
                        <span className="text-mint mr-2">✓</span>
                        {asset}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-cosmic border border-muted rounded p-3 text-sm italic">
                    {phase.copy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-mint bg-opacity-10 border border-mint rounded-lg">
            <p className="text-mint text-sm italic">
              "Clarity is returning. Let's forge ahead."
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RitualEngine;
