# 🌌 Starforge Setup Guide

This guide will help you get Starforge running locally.

---

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher) - Optional for now, app works without DB

---

## Quick Start (Frontend Only)

If you just want to see the UI and test the flow without a database:

```bash
# 1. Navigate to frontend
cd starforge/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

The app will open at `http://localhost:3001`

---

## Full Setup (Frontend + Backend)

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd starforge/frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Backend

```bash
# Copy environment template
cd backend
cp .env.example .env

# Edit .env with your settings
# You can skip database config for now - the app will still work
```

### 3. (Optional) Setup Database

If you want to persist data:

```bash
# Create database
createdb starforge

# Run schema
psql -d starforge -f src/database/schema.sql
```

### 4. Start Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd starforge/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd starforge/frontend
npm start
```

---

## Usage Flow

### 1. Twin Genesis Panel
- Upload audio samples (`.mp3`, `.wav`)
- Add visual moodboard (`.jpg`, `.png`)
- Write sample captions and bio
- Upload calendar (`.ics` or `.csv`)
- Set your glow level (1-5)
- Click "Generate Twin OS"

### 2. Ritual Engine
- Enter track name
- Set drop date
- Choose ritual mode:
  - **Full Ritual**: 4-phase campaign (tease → announce → drop → follow-up)
  - **Low-Energy Mode**: Compressed 2-phase (announce → drop)
- Click "Generate Campaign"

### 3. Glowline
- View your campaign timeline
- Check off completed assets
- See generated copy for each phase
- Track campaign progress

### 4. Glowmeter
- Always visible at top of app
- Shows current capacity based on:
  - Your glow level
  - Ritual plan workload
  - Calendar events (if uploaded)
- Provides suggestions when overloaded

---

## File Support

- **Audio**: `.mp3`, `.wav`
- **Visual**: `.jpg`, `.jpeg`, `.png`
- **Calendar**: `.ics`, `.csv`

---

## Customization

### Changing Colors

Edit `frontend/tailwind.config.js`:

```js
colors: {
  cosmic: '#0F0F1A',    // Background
  glow: '#A882FF',      // Primary (lavender)
  mint: '#26FFE6',      // Secondary (aqua)
  text: '#F4F4F4',      // Body text
  muted: '#6C6C80',     // Low-energy states
},
```

### Changing Fonts

The app uses Inter as a fallback. To use custom fonts:

1. Add font files to `frontend/public/fonts/`
2. Update `frontend/src/index.css`:

```css
@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Bold.woff2') format('woff2');
  font-weight: 700;
}
```

3. Update `tailwind.config.js`:

```js
fontFamily: {
  header: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['General Sans', 'Inter', 'sans-serif'],
},
```

---

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is taken:

- Frontend: Set `PORT=3001` before `npm start`
- Backend: Edit `PORT` in `.env`

### File Upload Fails

- Check file size (max 50MB)
- Verify file type is supported
- Ensure `backend/uploads/` directory exists

### Proxy Errors

If frontend can't reach backend:

- Verify backend is running on port 5000
- Check `proxy` setting in `frontend/package.json`

---

## Next Steps

- Add authentication (JWT is configured but not implemented)
- Connect to PostgreSQL for data persistence
- Implement AI copy generation (OpenAI, Anthropic)
- Add calendar parsing logic
- Deploy to production (Vercel + Railway/Render)

---

**Built for those who protect their glow while forging their empire.**
