# 🏗️ Starforge Architecture

## Philosophy

Starforge is built on the principle that **artist operations should protect creative energy**, not drain it.

The architecture reflects this through:
- **Minimal cognitive load**: Single-column focus, clear hierarchy
- **Energy-aware UX**: Glowmeter provides constant feedback
- **Ritual over chaos**: Structured campaign flows replace panic-mode drops

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React + Tailwind CSS (Port 3000)               │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Twin Genesis │  │ Glowmeter    │            │
│  │ Panel        │  │ (Always On)  │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Ritual       │  │ Glowline     │            │
│  │ Engine       │  │ Timeline     │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      │
                      │ HTTP/REST
                      ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  Node.js + Express (Port 5000)                  │
│                                                  │
│  API Routes:                                     │
│  • /api/twin/generate                           │
│  • /api/ritual/generate                         │
│  • /api/upload                                  │
│  • /api/calendar/parse                          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                  DATABASE                        │
│  PostgreSQL                                      │
│                                                  │
│  Tables:                                         │
│  • users                                         │
│  • twin_profiles                                │
│  • ritual_plans                                 │
│  • glow_logs                                    │
│  • calendar_events                              │
└─────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── Header (Starforge branding)
├── Glowmeter (persistent)
├── Navigation (Genesis / Ritual / Timeline)
└── Views
    ├── TwinGenesisPanel
    │   ├── Audio uploader
    │   ├── Visual moodboard
    │   ├── Caption/bio input
    │   ├── Calendar sync
    │   └── Glow slider
    │
    ├── RitualEngine
    │   ├── Drop details input
    │   ├── Ritual mode selector
    │   └── Generated campaign view
    │
    └── Glowline
        ├── Timeline visualization
        ├── Phase cards
        └── Campaign overview
```

---

## Data Flow

### 1. Twin Generation Flow

```
User uploads files + inputs text
        ↓
TwinGenesisPanel collects data
        ↓
POST /api/twin/generate
        ↓
Backend processes:
  - Audio analysis (placeholder)
  - Visual tone detection
  - Capacity calculation
        ↓
Twin data returned to frontend
        ↓
App state updated
        ↓
User proceeds to Ritual Engine
```

### 2. Ritual Creation Flow

```
User enters drop details
        ↓
Selects ritual mode (Full / Low-Energy)
        ↓
POST /api/ritual/generate
        ↓
Backend generates:
  - Phase timeline
  - Asset checklists
  - Auto-generated copy
        ↓
Ritual plan returned
        ↓
Glowmeter recalculates capacity
        ↓
User views Glowline
```

### 3. Glowmeter Calculation

```
Inputs:
  - Current glow level (1-5)
  - Ritual mode (Full = 80 load, Low = 40 load)
  - Calendar events (future: parsed from .ics)
        ↓
Calculate total capacity load
        ↓
Determine status:
  - 0-59%: Optimal (mint)
  - 60-79%: Moderate (glow)
  - 80-100%: Overload (glow, with warning)
        ↓
Generate suggestions
        ↓
Display bar + status + nudge from Twin
```

---

## Color System (Semantic Usage)

| Color | Hex | Usage |
|-------|-----|-------|
| **Cosmic** | `#0F0F1A` | Background, depth, void |
| **Glow** | `#A882FF` | Primary actions, moderate energy, warnings |
| **Mint** | `#26FFE6` | Secondary actions, optimal state, success |
| **Text** | `#F4F4F4` | Body text, readable content |
| **Muted** | `#6C6C80` | Low-energy states, disabled, borders |

---

## Key Design Patterns

### 1. Energy-First Design
Every UI decision considers cognitive load:
- Single-column layout (no context-switching)
- Fixed CTA (always accessible)
- Persistent Glowmeter (constant feedback)

### 2. Ritual Over Grind
Structured flows replace ad-hoc chaos:
- Genesis → Ritual → Timeline (linear progression)
- Pre-defined phases (no blank slate paralysis)
- Auto-generated copy (reduce decision fatigue)

### 3. The Twin Voice
Minimal, poetic nudges guide the artist:
- "Glow low. Ritual compressed." (overload warning)
- "Clarity is returning. Let's forge ahead." (confirmation)
- Appears contextually, never intrusive

---

## Future Extensions

### Phase 1: Core (Current)
- ✅ Twin Genesis Panel
- ✅ Ritual Engine
- ✅ Glowline
- ✅ Glowmeter

### Phase 2: Intelligence
- AI-powered copy generation (GPT-4, Claude)
- Audio analysis for voice tone
- Visual similarity detection for brand consistency
- Calendar parsing (.ics full support)

### Phase 3: Collaboration
- Team view (manager, label, designer)
- Shared ritual plans
- Asset approval workflow
- Real-time sync

### Phase 4: Protocol
- Public API for 3rd-party integrations
- Twin OS as a service
- Template marketplace
- Cross-platform mobile app

---

## Tech Stack Rationale

| Choice | Why |
|--------|-----|
| **React** | Component-based, fast iteration, huge ecosystem |
| **Tailwind** | Utility-first, rapid styling, consistent design |
| **Express** | Minimal, flexible, easy to extend |
| **PostgreSQL** | Relational data, JSONB for flexibility, battle-tested |
| **JWT** | Stateless auth, simple to implement |
| **Multer** | File uploads, supports multiple formats |

---

**The architecture protects the glow. Every layer, every choice.**
