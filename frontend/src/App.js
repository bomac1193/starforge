import React, { useCallback, useState } from 'react';
import './App.css';
import CoherenceDashboard from './components/CoherenceDashboard';
import NommoPanel from './components/NommoPanel';
import LibraryPage from './components/LibraryPage';
import RelationalPanel from './components/RelationalPanel';
import RescanToast from './components/RescanToast';
import { RescanProgressProvider } from './context/RescanProgressContext';

// Detect quiz callback. If subtaste_user_id param is present, open Nommo tab.
const getInitialView = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('subtaste_user_id')) return 'genesis';
  return 'dashboard';
};

function App() {
  const [activeView, setActiveView] = useState(getInitialView);
  const [twinData, setTwinData] = useState(null);

  const handleTwinGenerated = (data) => {
    setTwinData(data);
  };

  // Called by the rescan toast when the user clicks a completed job.
  // Jumps to the target view and scrolls the referenced element into view.
  const handleRescanNavigate = useCallback((target) => {
    if (target?.view) {
      setActiveView(target.view);
    }
    if (target?.elementId) {
      // Wait for the view switch to render before scrolling.
      setTimeout(() => {
        const el = document.getElementById(target.elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }
  }, []);

  return (
    <RescanProgressProvider onNavigate={handleRescanNavigate}>
    <div className="min-h-screen bg-brand-bg">
      <RescanToast />
      {/* Header */}
      <header className="border-b border-brand-border py-8">
        <div className="max-w-container mx-auto px-8">
          <h1 className="text-display-lg text-brand-text">
            Ori
          </h1>
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
            Nommo
          </button>
          <button
            onClick={() => setActiveView('relational')}
            className={`pb-4 uppercase-label transition-all ${
              activeView === 'relational'
                ? 'border-b-2 border-brand-text text-brand-text'
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Relational
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
            <NommoPanel
              onTwinGenerated={handleTwinGenerated}
            />
          )}

          {activeView === 'relational' && (
            <RelationalPanel />
          )}
        </div>
      </main>
    </div>
    </RescanProgressProvider>
  );
}

export default App;
