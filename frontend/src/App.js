import React, { useState } from 'react';
import './App.css';
import CoherenceDashboard from './components/CoherenceDashboard';
import TwinGenesisPanelChic from './components/TwinGenesisPanelChic';
import LibraryPage from './components/LibraryPage';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [twinData, setTwinData] = useState(null);

  const handleTwinGenerated = (data) => {
    setTwinData(data);
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
        {/* Navigation */}
        <nav className="flex gap-6 mb-12 border-b border-brand-border pb-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'dashboard'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Aesthetic DNA
          </button>
          <button
            onClick={() => setActiveView('library')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'library'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Music Library
          </button>
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
        </nav>

        {/* View Content */}
        <div className="animate-fadeIn">
          {activeView === 'dashboard' && (
            <CoherenceDashboard userId="default_user" />
          )}

          {activeView === 'library' && (
            <LibraryPage />
          )}

          {activeView === 'genesis' && (
            <TwinGenesisPanelChic
              onTwinGenerated={handleTwinGenerated}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
