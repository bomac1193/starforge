# 📁 Starforge Project Structure

Complete file tree and organization.

---

## Root Directory

```
starforge/
├── frontend/              # React frontend application
├── backend/               # Node.js + Express API
├── README.md              # Project overview with kernel
├── SETUP.md               # Installation and setup guide
├── ARCHITECTURE.md        # System architecture documentation
├── DESIGN_SYSTEM.md       # UI/UX design guidelines
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT License
├── PROJECT_STRUCTURE.md   # This file
├── package.json           # Root package with convenience scripts
├── start.sh               # Quick start script
└── .gitignore             # Git ignore rules
```

---

## Frontend Structure

```
frontend/
├── public/
│   └── index.html         # HTML template
│
├── src/
│   ├── components/
│   │   ├── TwinGenesisPanel.js    # Upload audio, visuals, bio, calendar
│   │   ├── Glowmeter.js           # Energy capacity tracker
│   │   ├── RitualEngine.js        # Campaign planning interface
│   │   └── Glowline.js            # Timeline visualization
│   │
│   ├── App.js             # Main application component
│   ├── App.css            # Custom animations and effects
│   ├── index.js           # React entry point
│   └── index.css          # Global styles + Tailwind
│
├── package.json           # Frontend dependencies
├── tailwind.config.js     # Tailwind configuration (colors, fonts)
└── postcss.config.js      # PostCSS configuration
```

### Frontend Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **TwinGenesisPanel** | Input creative DNA | Audio/visual upload, bio, calendar sync, glow slider |
| **Glowmeter** | Energy capacity display | Capacity bar, status indicator, suggestions |
| **RitualEngine** | Campaign planning | Track input, ritual mode selector, timeline generator |
| **Glowline** | Timeline view | Phase cards, asset checklists, progress tracking |

---

## Backend Structure

```
backend/
├── src/
│   ├── database/
│   │   └── schema.sql     # PostgreSQL database schema
│   │
│   └── server.js          # Express server with API routes
│
├── uploads/               # File upload directory (auto-created)
├── package.json           # Backend dependencies
├── .env.example           # Environment variables template
└── .env                   # Actual env vars (not in git)
```

### Backend API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | File upload handler |
| `/api/twin/generate` | POST | Generate Twin OS profile |
| `/api/ritual/generate` | POST | Create ritual campaign plan |
| `/api/calendar/parse` | POST | Parse .ics/.csv calendar files |

---

## Database Schema

### Tables

```
users              # User accounts
twin_profiles      # Generated Twin OS data
uploaded_files     # File metadata
ritual_plans       # Campaign plans
glow_logs          # Daily energy tracking
calendar_events    # Synced calendar data
```

See `backend/src/database/schema.sql` for full schema.

---

## Configuration Files

### Frontend Config

**package.json**
- Dependencies: React, Tailwind, react-dropzone, axios, date-fns
- Scripts: `start`, `build`, `test`
- Proxy: `http://localhost:5000` (backend)

**tailwind.config.js**
- Colors: Cosmic, Glow, Mint, Text, Muted
- Fonts: Inter (fallback for Satoshi/General Sans)
- Max width: 960px container

### Backend Config

**package.json**
- Dependencies: Express, cors, pg, multer, jsonwebtoken, bcrypt
- Scripts: `start`, `dev` (with nodemon)

**.env**
- `PORT`: Server port (default 5000)
- `DB_*`: PostgreSQL credentials
- `JWT_SECRET`: Auth secret key
- `MAX_FILE_SIZE`: Upload limit

---

## File Types Supported

### Uploads

| Type | Extensions | Max Size | Used For |
|------|------------|----------|----------|
| **Audio** | `.mp3`, `.wav` | 50MB | Voice analysis, sample generation |
| **Visual** | `.jpg`, `.jpeg`, `.png` | 50MB | Moodboard, tone detection |
| **Calendar** | `.ics`, `.csv` | 5MB | Schedule sync, capacity calculation |

---

## Scripts

### Root Level

```bash
npm run install-all   # Install all dependencies
npm run dev           # Start both frontend + backend
npm run dev:frontend  # Frontend only (port 3000)
npm run dev:backend   # Backend only (port 5000)
npm run build         # Build frontend for production
```

### Quick Start

```bash
./start.sh            # Auto-install deps + start servers
```

---

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database (optional for now)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=starforge
DB_USER=postgres
DB_PASSWORD=your_password

# Auth
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Uploads
MAX_FILE_SIZE=52428800
```

---

## Git Ignored Files

See `.gitignore` for full list:
- `node_modules/`
- `frontend/build/`
- `backend/uploads/`
- `.env`
- OS files (`.DS_Store`, `Thumbs.db`)
- IDE files (`.vscode/`, `.idea/`)

---

## Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Project overview, kernel, vision, setup |
| **SETUP.md** | Detailed installation and configuration |
| **ARCHITECTURE.md** | System design, data flow, tech stack |
| **DESIGN_SYSTEM.md** | UI/UX guidelines, colors, typography, components |
| **CONTRIBUTING.md** | Contribution guidelines, code style |
| **PROJECT_STRUCTURE.md** | This file - complete file tree |

---

## Next Steps for Extension

### Immediate Additions

```
frontend/src/
├── utils/
│   ├── api.js              # Axios API helpers
│   ├── dateHelpers.js      # Date formatting utilities
│   └── validators.js       # Input validation
│
├── hooks/
│   ├── useAuth.js          # Authentication hook
│   └── useGlowLog.js       # Glow tracking hook
│
└── context/
    └── TwinContext.js      # Global Twin state
```

### Future Modules

```
backend/src/
├── routes/
│   ├── auth.js             # JWT auth routes
│   ├── twin.js             # Twin OS routes
│   ├── ritual.js           # Ritual engine routes
│   └── glow.js             # Glow tracking routes
│
├── middleware/
│   ├── auth.js             # JWT verification
│   └── upload.js           # File validation
│
├── services/
│   ├── aiService.js        # OpenAI/Anthropic integration
│   ├── calendarService.js  # .ics parsing
│   └── twinService.js      # Twin generation logic
│
└── database/
    ├── schema.sql          # Already exists
    ├── migrations/         # Database migrations
    └── seeds/              # Test data
```

---

## Total File Count

**Current:**
- Frontend: 11 files
- Backend: 4 files
- Root: 9 documentation + config files
- **Total: 24 files**

---

**This structure balances simplicity with extensibility. Build the OS first. The protocol follows.**
