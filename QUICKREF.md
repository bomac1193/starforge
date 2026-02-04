# ⚡ Starforge Quick Reference

One-page cheat sheet for developers.

---

## 🚀 Quick Start

```bash
cd starforge
./start.sh              # Auto-setup and start
# or
npm run install-all     # Install deps
npm run dev             # Start both servers
```

**URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:5000

---

## 🎨 Colors

```
#0F0F1A  cosmic   Background
#A882FF  glow     Primary / Moderate
#26FFE6  mint     Secondary / Optimal
#F4F4F4  text     Body text
#6C6C80  muted    Low-energy / Disabled
```

**Tailwind classes:**
`bg-cosmic` `text-glow` `border-mint` `text-muted`

---

## 📏 Typography

```jsx
<h1 className="text-4xl md:text-5xl tracking-wider font-header">
<h2 className="text-3xl md:text-4xl tracking-wide font-header">
<p className="font-body">
```

**Font stack:** Inter (fallback for Satoshi/General Sans)

---

## 🧱 Components

### Button
```jsx
<button className="btn-primary">Click</button>
<button className="btn-secondary">Click</button>
```

### Card
```jsx
<div className="card">
  <h3 className="text-xl">Title</h3>
  <p className="text-muted">Description</p>
</div>
```

### Input
```jsx
<input className="input-field" placeholder="Enter text" />
```

### Glow Effect
```jsx
<div className="glow-effect">Glowing element</div>
```

---

## 📐 Layout

```jsx
<main className="max-w-container mx-auto px-6 py-12">
  <div className="space-y-8">
    <section className="card">...</section>
  </div>
</main>
```

**Max width:** 960px
**Spacing:** Use Tailwind `space-y-{n}` (4, 6, 8, 12)

---

## 🔌 API Endpoints

| Endpoint | Method | Body |
|----------|--------|------|
| `/api/health` | GET | - |
| `/api/upload` | POST | FormData (files) |
| `/api/twin/generate` | POST | `{ audioFiles, visualFiles, caption, bio, glowLevel }` |
| `/api/ritual/generate` | POST | `{ trackName, dropDate, ritualMode, twinData, glowLevel }` |
| `/api/calendar/parse` | POST | FormData (calendar file) |

---

## 🗄️ Database Tables

```
users            # User accounts
twin_profiles    # Twin OS data
uploaded_files   # File metadata
ritual_plans     # Campaigns
glow_logs        # Energy tracking
calendar_events  # Synced calendar
```

**Connection:** See `backend/.env.example`

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.js` | Main app component |
| `frontend/src/components/TwinGenesisPanel.js` | Upload interface |
| `frontend/src/components/RitualEngine.js` | Campaign planner |
| `frontend/src/components/Glowline.js` | Timeline view |
| `frontend/src/components/Glowmeter.js` | Capacity tracker |
| `backend/src/server.js` | Express API |
| `backend/src/database/schema.sql` | DB schema |

---

## 🎭 Twin Voice

Copy style for AI-generated messages:

```
"Glow low. Ritual compressed."
"Clarity is returning. Let's forge ahead."
"Overload detected. The Twin suggests reducing scope."
```

**Rules:**
- Max 2 sentences
- Present tense
- No questions or exclamation marks
- Third person ("The Twin suggests...")

---

## ✅ Testing Checklist

Before submitting:
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Files upload correctly
- [ ] Glowmeter updates on plan creation
- [ ] Timeline renders all phases
- [ ] Colors match design system
- [ ] Twin voice appears when glow ≤ 2

---

## 🐛 Common Issues

**Port in use:**
```bash
# Kill process on port 3000 or 5000
lsof -ti:3000 | xargs kill
```

**File upload fails:**
- Check max size (50MB)
- Verify file type (.mp3, .wav, .jpg, .png, .ics, .csv)
- Ensure `backend/uploads/` directory exists

**Frontend can't reach backend:**
- Verify backend running on port 5000
- Check proxy in `frontend/package.json`

---

## 📚 Full Documentation

- **README.md** - Overview + kernel
- **SETUP.md** - Installation guide
- **ARCHITECTURE.md** - System design
- **DESIGN_SYSTEM.md** - UI/UX guidelines
- **CONTRIBUTING.md** - Contribution rules

---

**Don't Grind. Forge.** 🌌
