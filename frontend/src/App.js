import React, { useState } from 'react';
import './App.css';
import TwinGenesisPanelWithProgress from './components/TwinGenesisPanelWithProgress';
import Glowmeter from './components/Glowmeter';
import RitualEngine from './components/RitualEngine';
import Glowline from './components/Glowline';

function App() {
  const [activeView, setActiveView] = useState('genesis');
  const [twinData, setTwinData] = useState(null);
  const [ritualPlan, setRitualPlan] = useState(null);
  const [glowLevel, setGlowLevel] = useState(3);

  const handleTwinGenerated = (data) => {
    setTwinData(data);
    setActiveView('ritual');
  };

  const handleRitualCreated = (plan) => {
    setRitualPlan(plan);
  };

  return (
    <div className="min-h-screen bg-cosmic">
      {/* Header */}
      <header className="border-b border-muted py-6">
        <div className="max-w-container mx-auto px-6">
          <h1 className="text-glow">
            🌌 Starforge
          </h1>
          <p className="text-muted text-sm mt-2">Don't Grind. Forge.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-container mx-auto px-6 py-12">
        {/* Glowmeter - Always visible */}
        <div className="mb-12">
          <Glowmeter
            glowLevel={glowLevel}
            ritualPlan={ritualPlan}
          />
        </div>

        {/* Navigation */}
        <nav className="flex gap-4 mb-8 border-b border-muted pb-4">
          <button
            onClick={() => setActiveView('genesis')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeView === 'genesis'
                ? 'bg-glow text-cosmic'
                : 'text-muted hover:text-text'
            }`}
          >
            Twin Genesis
          </button>
          <button
            onClick={() => setActiveView('ritual')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeView === 'ritual'
                ? 'bg-glow text-cosmic'
                : 'text-muted hover:text-text'
            }`}
            disabled={!twinData}
          >
            Ritual Engine
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeView === 'timeline'
                ? 'bg-glow text-cosmic'
                : 'text-muted hover:text-text'
            }`}
            disabled={!ritualPlan}
          >
            Glowline
          </button>
        </nav>

        {/* View Content */}
        <div className="animate-fadeIn">
          {activeView === 'genesis' && (
            <TwinGenesisPanelWithProgress
              onTwinGenerated={handleTwinGenerated}
              onGlowChange={setGlowLevel}
            />
          )}

          {activeView === 'ritual' && twinData && (
            <RitualEngine
              twinData={twinData}
              glowLevel={glowLevel}
              onRitualCreated={handleRitualCreated}
            />
          )}

          {activeView === 'timeline' && ritualPlan && (
            <Glowline ritualPlan={ritualPlan} />
          )}
        </div>
      </main>

      {/* Fixed CTA - Bottom Right */}
      {ritualPlan && (
        <button
          className="fixed bottom-8 right-8 bg-mint text-cosmic px-8 py-4 rounded-full font-bold glow-effect hover:scale-105 transition-transform shadow-lg"
          onClick={() => setActiveView('ritual')}
        >
          Plan / Adjust Drop
        </button>
      )}

      {/* Twin Voice - Subtle nudge */}
      {glowLevel <= 2 && (
        <div className="fixed bottom-8 left-8 max-w-xs p-4 bg-cosmic border border-glow rounded-lg glow-effect">
          <p className="text-glow text-sm italic">
            "Glow low. Ritual compressed."
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
