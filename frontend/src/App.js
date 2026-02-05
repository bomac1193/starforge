import React, { useState } from 'react';
import './App.css';
import TwinGenesisPanelChic from './components/TwinGenesisPanelChic';
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
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b border-brand-border py-8">
        <div className="max-w-container mx-auto px-8">
          <h1 className="text-display-lg text-brand-text">
            Starforge
          </h1>
          <p className="text-body text-brand-secondary mt-1">Don't Grind. Forge.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-container mx-auto px-8 py-16">
        {/* Glowmeter - Always visible */}
        <div className="mb-16">
          <Glowmeter
            glowLevel={glowLevel}
            ritualPlan={ritualPlan}
          />
        </div>

        {/* Navigation */}
        <nav className="flex gap-6 mb-12 border-b border-brand-border pb-1">
          <button
            onClick={() => setActiveView('genesis')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'genesis'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Twin Genesis
          </button>
          <button
            onClick={() => setActiveView('ritual')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'ritual'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
            disabled={!twinData}
          >
            Ritual Engine
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'timeline'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
            disabled={!ritualPlan}
          >
            Timeline
          </button>
        </nav>

        {/* View Content */}
        <div className="animate-fadeIn">
          {activeView === 'genesis' && (
            <TwinGenesisPanelChic
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
          className="fixed bottom-8 right-8 btn-primary shadow-sm"
          onClick={() => setActiveView('ritual')}
        >
          Adjust Drop
        </button>
      )}

      {/* Twin Voice - Subtle nudge */}
      {glowLevel <= 2 && (
        <div className="fixed bottom-8 left-8 max-w-xs p-4 bg-brand-surface border border-brand-border">
          <p className="text-brand-secondary text-body-sm italic">
            Low energy. Ritual compressed.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
