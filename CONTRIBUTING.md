# 🌌 Contributing to Starforge

First off, thank you for considering contributing to Starforge. This project exists to protect creative energy—and that includes yours as a contributor.

---

## Philosophy

Before contributing, understand the core principles:

1. **Energy-first design** - Every feature should reduce cognitive load, not add to it
2. **Ritual over chaos** - Structured flows beat blank slates
3. **The Twin protects the artist** - Build as if the user's creative career depends on it

---

## How to Contribute

### Reporting Bugs

Before creating an issue:
- Check if it's already reported
- Verify it happens consistently
- Note your OS, browser, and Node version

**Good bug report:**
```
Title: Glowmeter doesn't update after ritual plan creation

Steps to reproduce:
1. Generate Twin OS
2. Create ritual plan (Full mode)
3. Check Glowmeter

Expected: Capacity should increase to ~80%
Actual: Stays at baseline

Environment:
- OS: macOS 14.0
- Browser: Chrome 120
- Node: v18.17.0
```

### Suggesting Features

We love ideas, but they must align with the philosophy.

**Ask yourself:**
- Does this reduce tool chaos or add to it?
- Does this protect energy or drain it?
- Would a tired artist at 2am find this helpful or overwhelming?

**Good feature request:**
```
Title: Auto-detect optimal drop day based on calendar

Problem:
Artists don't know when they'll have capacity for a drop.
They either guess (and burn out) or over-plan (and never ship).

Proposed solution:
Parse calendar events, analyze glow logs, suggest 3 optimal windows.

Why it matters:
Reduces decision fatigue. The Twin makes the hard call.
```

### Pull Requests

#### Before You Start

1. **Open an issue first** - Discuss big changes before coding
2. **Check existing PRs** - Someone might be working on it
3. **Read the design system** - UI must match the aesthetic

#### PR Guidelines

**Good PR:**
- Solves one problem
- Includes tests (when applicable)
- Follows existing code style
- Updates documentation
- Has descriptive commit messages

**Commit message format:**
```
Add Glowmeter capacity calculation logic

- Calculate load based on ritual mode
- Factor in glow level
- Generate suggestions for overload state
- Update Glowmeter component to display status
```

**Bad commit messages:**
- "fix bug"
- "updates"
- "asdfasdf"

---

## Development Setup

See [SETUP.md](./SETUP.md) for detailed instructions.

Quick start:
```bash
# Clone repo
git clone https://github.com/yourusername/starforge.git
cd starforge

# Install dependencies
npm run install-all

# Start dev servers
./start.sh
```

---

## Code Style

### JavaScript/React

- Use functional components
- Prefer `const` over `let`
- Destructure props
- Use meaningful variable names

**Good:**
```jsx
const RitualEngine = ({ twinData, glowLevel, onRitualCreated }) => {
  const [trackName, setTrackName] = useState('');
  // ...
};
```

**Bad:**
```jsx
function RitualEngine(props) {
  var t = '';
  // ...
}
```

### CSS/Tailwind

- Use Tailwind utilities first
- Custom CSS only for complex animations
- Follow the design system colors

**Good:**
```jsx
<button className="btn-primary">
  Generate
</button>
```

**Bad:**
```jsx
<button style={{ backgroundColor: '#A882FF', padding: '12px 24px' }}>
  Generate
</button>
```

### File Structure

```
frontend/src/
├── components/
│   ├── TwinGenesisPanel.js
│   ├── Glowmeter.js
│   └── ...
├── utils/
│   └── helpers.js
├── App.js
├── App.css
└── index.css
```

---

## Design Contributions

### UI/UX Changes

All UI changes must:
1. Follow the [design system](./DESIGN_SYSTEM.md)
2. Use the exact color palette
3. Maintain energy-first principles
4. Include screenshots in PR

### Adding Fonts

If proposing custom fonts:
1. Ensure they're open-source or properly licensed
2. Provide fallbacks
3. Keep file size under 200KB total
4. Match the aesthetic (modern, geometric, readable)

---

## Testing

### Manual Testing Checklist

Before submitting PR, test:
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive (mobile, tablet, desktop)
- [ ] No console errors
- [ ] File uploads work
- [ ] Glowmeter updates correctly
- [ ] Generated plans render properly

### Future: Automated Tests

We'll add Jest + React Testing Library soon. If you want to help, this is a great first contribution.

---

## Documentation

If you change functionality, update:
- README.md (user-facing features)
- ARCHITECTURE.md (technical changes)
- DESIGN_SYSTEM.md (UI/UX changes)
- Code comments (complex logic only)

---

## Community Guidelines

### Be Kind

This project is for creatives protecting their energy. Bring that same care to interactions:
- Assume good intent
- Give constructive feedback
- Celebrate contributions
- Help newcomers

### No Gatekeeping

Whether you're a senior dev or writing your first PR, you're welcome.

### Protect the Vision

Debate ideas vigorously, but respect the core philosophy. Starforge is not a generic productivity tool. It's an artist's nervous system.

---

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Invited to shape the roadmap

Significant contributions earn:
- "Core Contributor" badge
- Early access to new features
- Input on major decisions

---

## Questions?

- Open an issue with the `question` label
- Email: [Coming soon]
- Discord: [Coming soon]

---

**Thank you for helping artists protect their glow. Every contribution matters.**
