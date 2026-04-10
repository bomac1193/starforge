import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Archetype metadata for selector
const ARCHETYPES = [
  { designation: 'S-0', glyph: 'KETH', symbol: 'Θ', mode: 'Visionary' },
  { designation: 'T-1', glyph: 'STRATA', symbol: 'Σ', mode: 'Architect' },
  { designation: 'V-2', glyph: 'OMEN', symbol: 'Ψ', mode: 'Diviner' },
  { designation: 'L-3', glyph: 'SILT', symbol: 'Δ', mode: 'Sedimentary' },
  { designation: 'C-4', glyph: 'CULL', symbol: 'Ξ', mode: 'Editor' },
  { designation: 'N-5', glyph: 'LIMN', symbol: 'Λ', mode: 'Bridge' },
  { designation: 'H-6', glyph: 'TOLL', symbol: 'Ω', mode: 'Broadcaster' },
  { designation: 'P-7', glyph: 'VAULT', symbol: 'Φ', mode: 'Archivist' },
  { designation: 'D-8', glyph: 'WICK', symbol: 'Π', mode: 'Igniter' },
  { designation: 'F-9', glyph: 'ANVIL', symbol: 'Γ', mode: 'Fabricator' },
  { designation: 'R-10', glyph: 'SCHISM', symbol: 'Ζ', mode: 'Disruptor' },
  { designation: 'Ø', glyph: 'VOID', symbol: 'Ø', mode: 'Unclassified' },
];

const COLLAB_TYPE_STYLES = {
  natural_allies: { label: 'Natural Allies', accent: '#0A0A0A' },
  growth_catalyst: { label: 'Growth Catalyst', accent: '#2A2A2A' },
  creative_friction: { label: 'Creative Friction', accent: '#5A5A5A' },
  challenging: { label: 'Challenging', accent: '#8A8A8A' },
  neutral: { label: 'Neutral', accent: '#AAAAAA' },
};

const DEFAULT_MODES = [
  { key: 'open', label: 'Open Exploration', description: 'No fixed agenda. Base archetype dynamics only.' },
  { key: 'ship', label: 'Ship & Execute', description: 'Deadlines, deliverables, manifestation.' },
  { key: 'explore', label: 'Research & Discover', description: 'Sensing and deep listening before commitment.' },
  { key: 'launch', label: 'Launch & Amplify', description: 'Public release, distribution, reach.' },
  { key: 'refine', label: 'Refine & Edit', description: 'Polish and tighten the work.' },
  { key: 'rupture', label: 'Break & Reimagine', description: 'Scrap the plan, fracture conventions.' },
  { key: 'critique', label: 'Critique & Pressure-Test', description: 'Find the weakness before the world does.' },
];

// Human-readable explanations for each relational dynamic type.
// These describe how the "from" archetype relates to the "to" archetype.
const DYNAMIC_TYPE_META = {
  collaborate: {
    label: 'Collaborates with',
    blurb: 'works in the same direction. Amplifies the other without stepping on them.',
  },
  growth: {
    label: 'Grows from',
    blurb: 'is stretched into new territory by the other\'s approach.',
  },
  tension: {
    label: 'Tensions with',
    blurb: 'productive friction. They disagree, and the disagreement sharpens the work.',
  },
  avoid: {
    label: 'Clashes with',
    blurb: 'fundamental mismatch. Forcing this pairing costs both of them.',
  },
};

const MODE_FIT_META = {
  mode_fit: {
    label: 'Mode fit',
    blurb: 'is built for this kind of work. The mode plays to their strengths.',
  },
  mode_drag: {
    label: 'Mode drag',
    blurb: 'is fighting the mode. Their natural gear doesn\'t match what the work wants.',
  },
};

export default function RelationalPanel() {
  const [userProfile, setUserProfile] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [modes, setModes] = useState(DEFAULT_MODES);
  const [selectedMode, setSelectedMode] = useState('open');

  // Fetch user's own profile and available work modes on mount
  useEffect(() => {
    fetchUserProfile();
    fetchModes();
  }, []);

  // Re-run analysis if mode changes while an archetype is already selected
  useEffect(() => {
    if (selectedArchetype) {
      analyzeDuo(selectedArchetype, selectedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  const fetchModes = async () => {
    try {
      const res = await axios.get(`${API}/relational/modes`);
      if (res.data?.modes?.length) setModes(res.data.modes);
    } catch {
      /* keep defaults */
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      // Use lightweight cached genome endpoint (instant) instead of heavy /context
      const res = await axios.get(`${API}/subtaste/genome/default_user/cached`);
      const genome = res.data?.genome;
      const archetype = genome?.archetype || genome;
      if (archetype?.primary?.designation) {
        setUserProfile({
          archetypePrimary: archetype.primary.designation,
          archetypeSecondary: archetype.secondary?.designation,
          distribution: archetype.distribution,
        });
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const analyzeDuo = async (archetype, modeOverride) => {
    if (!userProfile) return;
    setSelectedArchetype(archetype);
    setLoading(true);

    try {
      // Archetype-explorer mode: pass profile1's exact distribution as
      // profile2's distribution. We're exploring "how would I click with a
      // {archetype} twin of myself," so we hold the taste spread constant and
      // only swap the dominant archetype. This gives cosine similarity = 1.0
      // by construction, so the complementarity ceiling is determined purely
      // by the archetype dynamics + work mode. A mutual collaborator pairing
      // in the right mode will now correctly reach 100%.
      const res = await axios.post(`${API}/relational/duo`, {
        profile1: userProfile,
        profile2: {
          archetypePrimary: archetype.designation,
          distribution: { ...(userProfile.distribution || {}) },
        },
        mode: modeOverride || selectedMode,
      });

      if (res.data?.success) {
        setAnalysis(res.data);
      }
    } catch (err) {
      console.error('Duo analysis failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-brand-border rounded w-1/3" />
        <div className="h-40 bg-brand-border rounded" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="border border-brand-border p-12 text-center">
        <p className="text-body text-brand-secondary">
          Complete your identity profile in the Nommo tab first.
        </p>
      </div>
    );
  }

  const userArch = ARCHETYPES.find(a => a.designation === userProfile.archetypePrimary);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-display-md text-brand-text mb-2">Relational Intelligence</h2>
        <p className="text-body text-brand-secondary">
          Explore creative chemistry between archetypes. Select a collaborator type to analyze complementarity.
        </p>
      </div>

      {/* Your Profile Summary */}
      <div className="border border-brand-border p-6">
        <p className="uppercase-label text-brand-secondary mb-4">Your Identity</p>
        <div className="flex items-baseline gap-3">
          <span className="text-display-lg text-brand-text">{userArch?.symbol}</span>
          <div>
            <p className="text-body text-brand-text font-medium">{userArch?.glyph}</p>
            <p className="text-label text-brand-secondary">{userArch?.designation} · {userArch?.mode}</p>
          </div>
        </div>
      </div>

      {/* Work Mode Selector */}
      <div>
        <p className="uppercase-label text-brand-secondary mb-2">Mode of Work</p>
        <p className="text-label text-brand-secondary mb-4">
          The lens the collaboration is viewed through. Match quality shifts with the mode.
        </p>
        <div className="flex flex-wrap gap-2">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedMode(m.key)}
              className={`border px-4 py-2 text-label transition-colors ${
                selectedMode === m.key
                  ? 'border-brand-text bg-brand-text text-white'
                  : 'border-brand-border hover:border-brand-text text-brand-text'
              }`}
              title={m.description}
            >
              {m.label}
            </button>
          ))}
        </div>
        {(() => {
          const active = modes.find(m => m.key === selectedMode);
          return active?.description ? (
            <p className="text-label text-brand-secondary mt-3 italic">{active.description}</p>
          ) : null;
        })()}
      </div>

      {/* Archetype Selector Grid */}
      <div>
        <p className="uppercase-label text-brand-secondary mb-4">Compare With</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {ARCHETYPES.filter(a => a.designation !== userProfile.archetypePrimary && a.designation !== 'Ø').map(arch => (
            <button
              key={arch.designation}
              onClick={() => analyzeDuo(arch)}
              disabled={loading}
              className={`border p-3 text-center transition-all ${
                selectedArchetype?.designation === arch.designation
                  ? 'border-brand-text bg-brand-text text-white'
                  : 'border-brand-border hover:border-brand-text text-brand-text'
              } ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <span className="text-display-sm block">{arch.symbol}</span>
              <span className="text-label block mt-1">{arch.glyph}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {loading && (
        <div className="border border-brand-border p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-brand-border rounded w-1/4" />
            <div className="h-4 bg-brand-border rounded w-2/3" />
            <div className="h-4 bg-brand-border rounded w-1/2" />
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8">
          {/* Complementarity Score */}
          <div className="border border-brand-text p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-display-lg text-brand-text">{analysis.profile1Summary?.glyph}</span>
                <span className="text-display-sm text-brand-secondary">×</span>
                <span className="text-display-lg text-brand-text">{analysis.profile2Summary?.glyph}</span>
              </div>
              <div className="text-right">
                <p className="text-display-xl text-brand-text">{analysis.complementarity}%</p>
                <p className="text-label text-brand-secondary">complementarity</p>
              </div>
            </div>

            {/* Collaboration Type */}
            {analysis.collaborationType && (
              <div className="border-t border-brand-border pt-4">
                <p className="text-label text-brand-secondary mb-1">
                  {COLLAB_TYPE_STYLES[analysis.collaborationType.type]?.label || analysis.collaborationType.type}
                  {analysis.mode?.label ? ` · ${analysis.mode.label}` : ''}
                </p>
                <p className="text-body text-brand-text">
                  {analysis.collaborationType.description}
                </p>
                {analysis.mode?.note && (
                  <p className="text-label text-brand-secondary mt-3 italic">
                    {analysis.mode.note}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dynamics Breakdown */}
          {(analysis.relational?.dynamics?.length > 0 || analysis.mode?.adjustment?.adjustments?.length > 0) && (() => {
            const glyphFor = (code) => ARCHETYPES.find(a => a.designation === code)?.glyph || code;
            const activeMode = modes.find(m => m.key === (analysis.mode?.key || selectedMode));
            const modeLabel = activeMode?.label || analysis.mode?.label || 'this mode';
            return (
              <div className="border border-brand-border p-6">
                <p className="uppercase-label text-brand-secondary mb-1">Dynamics</p>
                <p className="text-label text-brand-secondary mb-5">
                  How these two move together. Positive scores push complementarity up; negative scores push it down.
                </p>
                <div className="space-y-5">
                  {analysis.relational?.dynamics?.map((d, i) => {
                    const meta = DYNAMIC_TYPE_META[d.type] || { label: d.type, blurb: '' };
                    const fromGlyph = glyphFor(d.from);
                    const toGlyph = glyphFor(d.to);
                    const isPositive = d.score > 0;
                    return (
                      <div key={`dyn-${i}`} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                            d.type === 'collaborate' ? 'bg-brand-text'
                            : d.type === 'growth' ? 'bg-brand-text opacity-70'
                            : d.type === 'tension' ? 'bg-brand-text opacity-50'
                            : 'bg-brand-secondary'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-body text-brand-text">
                              <span className="font-medium">{fromGlyph}</span>
                              <span className="text-brand-secondary"> {meta.label.toLowerCase()} </span>
                              <span className="font-medium">{toGlyph}</span>
                            </p>
                            <p className="text-label text-brand-secondary mt-1">
                              {fromGlyph} {meta.blurb}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-label font-mono ${isPositive ? 'text-brand-text' : 'text-brand-secondary'}`}>
                            {isPositive ? '+' : ''}{d.score}
                          </span>
                          <p className="text-label text-brand-secondary uppercase text-[10px]">
                            {isPositive ? 'adds' : 'subtracts'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {analysis.mode?.adjustment?.adjustments?.map((a, i) => {
                    const meta = MODE_FIT_META[a.type] || { label: a.type, blurb: '' };
                    const glyph = glyphFor(a.designation);
                    const isPositive = a.score > 0;
                    return (
                      <div key={`mode-${i}`} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                            a.type === 'mode_fit' ? 'bg-brand-text opacity-90' : 'bg-brand-secondary opacity-60'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-body text-brand-text">
                              <span className="font-medium">{glyph}</span>
                              <span className="text-brand-secondary"> · {meta.label} for </span>
                              <span className="font-medium">{modeLabel}</span>
                            </p>
                            <p className="text-label text-brand-secondary mt-1">
                              {glyph} {meta.blurb}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-label font-mono ${isPositive ? 'text-brand-text' : 'text-brand-secondary'}`}>
                            {isPositive ? '+' : ''}{a.score}
                          </span>
                          <p className="text-label text-brand-secondary uppercase text-[10px]">
                            {isPositive ? 'adds' : 'subtracts'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-brand-border mt-5 pt-3 flex justify-between">
                  <span className="text-label text-brand-secondary">
                    Net relational score
                    {analysis.mode?.key && analysis.mode.key !== 'open' ? ` · ${modeLabel}` : ''}
                  </span>
                  <span className="text-body text-brand-text font-mono">
                    {(() => {
                      const net = (analysis.relational?.score || 0) + (analysis.mode?.adjustment?.score || 0);
                      return `${net > 0 ? '+' : ''}${net}`;
                    })()}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Your Affinity — what % of the user's genome is already this archetype.
              We used to show cosine similarity here, but profile2's distribution is
              seeded from profile1 (archetype-explorer mode), so similarity was 100%
              by construction. Affinity-weight is the honest, distinct-per-archetype
              number. */}
          {selectedArchetype && userProfile?.distribution && (() => {
            const weight = userProfile.distribution[selectedArchetype.designation] || 0;
            const pct = Math.round(weight * 100);
            const interp =
              pct >= 25 ? 'Strong latent weight. This archetype is already alive in you.'
              : pct >= 12 ? 'Meaningful trace. The mode is accessible when you reach for it.'
              : pct >= 6 ? 'Minor presence. You would lean on a true collaborator for this.'
              : 'Almost absent. This is pure complement, not overlap.';
            return (
              <div className="border border-brand-border p-6">
                <p className="uppercase-label text-brand-secondary mb-4">
                  Your Affinity to {selectedArchetype.glyph}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body text-brand-text">
                    {pct}% of your genome
                  </span>
                </div>
                <div className="w-full h-2 bg-brand-border">
                  <div
                    className="h-full bg-brand-text transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-label text-brand-secondary mt-2">{interp}</p>
              </div>
            );
          })()}

          {/* Creative Mode Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-brand-border p-4">
              <p className="text-label text-brand-secondary mb-1">You</p>
              <p className="text-body text-brand-text">{analysis.profile1Summary?.creativeMode}</p>
              <p className="text-label text-brand-secondary">{analysis.profile1Summary?.designation}</p>
            </div>
            <div className="border border-brand-border p-4">
              <p className="text-label text-brand-secondary mb-1">Collaborator</p>
              <p className="text-body text-brand-text">{analysis.profile2Summary?.creativeMode}</p>
              <p className="text-label text-brand-secondary">{analysis.profile2Summary?.designation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — no archetype selected yet */}
      {!analysis && !loading && (
        <div className="border border-dashed border-brand-border p-12 text-center">
          <p className="text-body text-brand-secondary">
            Select an archetype above to analyze creative chemistry.
          </p>
        </div>
      )}
    </div>
  );
}
