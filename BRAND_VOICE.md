# BRAND VOICE & UI PROFILE
## Elite Tastemaker Aesthetic

**Cultural Context:** Paris/New York fashion futurist DJ aesthetic
**Target Psychographic:** Elite tastemakers, cultural curators, artist-operators
**Not For:** Generic DJs, casual music fans, mass market

---

## BRAND VOICE

### Tone & Language

**DO:**
- Sophisticated, editorial voice
- Direct, no fluff
- Cultural positioning over self-promotion
- Earned, not aspirational
- Technical precision without jargon
- Minimal, poetic when appropriate

**DON'T:**
- Generic marketing speak
- Emojis (unless explicitly requested)
- Exclamation points
- Hype language ("amazing!", "incredible!")
- Clichés ("passion for music", "unique sound")
- Over-explanation

**Example Copy:**

✅ **Good:**
```
Your taste traces: Disco (1970s) → Detroit Techno → Jersey Club
Cultural lineage properly attributed, not marketed.
```

❌ **Bad:**
```
WOW! Your amazing taste is SO unique! 🎵🔥
You have an incredible passion for music that makes you special!
```

### Voice Characteristics

- **Confident, not arrogant:** "This is what your data shows" vs "You might have..."
- **Precise:** Specific numbers, names, dates (Frankie Knuckles, 1981, 123 BPM)
- **Culturally literate:** Reference origins, pioneers, movements
- **Understated:** Let the data speak, don't oversell
- **Inclusive of marginalized histories:** Proper attribution to Black, Caribbean, African diasporic origins

---

## TYPOGRAPHY

### Primary Typefaces

**Serif (Display & Body):**
- **Didot** - Editorial, fashion, high-contrast
- **Garamond** - Classic, readable, refined
- **Baskerville** - Transitional, sophisticated

**Sans-Serif (UI & Labels):**
- **Futura** - Geometric, modern, minimalist
- System fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Type Scale

```css
/* Display - Didot preferred */
.text-display-lg {
  font-size: 2.5rem;      /* 40px */
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-family: 'Didot', 'Garamond', serif;
}

.text-display-md {
  font-size: 2rem;        /* 32px */
  line-height: 1.2;
  letter-spacing: -0.01em;
  font-family: 'Didot', 'Garamond', serif;
}

.text-display-sm {
  font-size: 1.5rem;      /* 24px */
  line-height: 1.3;
  font-family: 'Didot', 'Garamond', serif;
}

/* Body - Garamond preferred */
.text-body-lg {
  font-size: 1.125rem;    /* 18px */
  line-height: 1.6;
  font-family: 'Garamond', 'Baskerville', serif;
}

.text-body-sm {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.5;
  font-family: 'Garamond', 'Baskerville', serif;
}

.text-body-xs {
  font-size: 0.75rem;     /* 12px */
  line-height: 1.4;
  font-family: 'Garamond', 'Baskerville', serif;
}

/* Labels - Futura preferred */
.uppercase-label {
  font-size: 0.625rem;    /* 10px */
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: 'Futura', sans-serif;
  font-weight: 500;
}
```

### Typography Rules

1. **Hierarchy:** Display (Didot) > Body (Garamond) > Labels (Futura)
2. **Line Length:** Max 65-75 characters for body text
3. **Alignment:** Left-aligned body text, centered only for hero/emphasis
4. **Kerning:** Tight for display (-0.02em), normal for body
5. **Weight:** Use weight sparingly (regular + medium only, no bold)

---

## COLOR PALETTE

### Primary Colors

```css
/* Monochrome Foundation */
--black: #000000;           /* Pure black - backgrounds, text */
--white: #FFFFFF;           /* Pure white - text on dark, accents */
--gray-50: #FAFAFA;         /* Lightest gray */
--gray-100: #F5F5F5;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;        /* Mid gray */
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;        /* Near black */

/* Brand Colors */
--brand-bg: #0A0A0A;        /* Background (near-black with warmth) */
--brand-text: #FAFAFA;      /* Primary text (off-white) */
--brand-secondary: #A3A3A3; /* Secondary text (mid-gray) */
--brand-muted: #737373;     /* Muted text (darker gray) */
--brand-border: #262626;    /* Borders (subtle) */
--brand-primary: #8B5CF6;   /* Accent (purple) - use sparingly */

/* Semantic Colors */
--success: #10B981;         /* Green - success states */
--error: #EF4444;           /* Red - errors */
--warning: #F59E0B;         /* Amber - warnings */
--info: #3B82F6;            /* Blue - informational */

/* Elite Purple Gradient (for premium features) */
--purple-50: #FAF5FF;
--purple-500: #8B5CF6;
--purple-600: #7C3AED;
--purple-900: #4C1D95;
--purple-950: #2E1065;
```

### Color Usage Rules

**90-5-5 Rule:**
- 90% monochrome (black, white, grays)
- 5% brand primary (purple - Elite features only)
- 5% semantic (success, error, etc.)

**Specific Applications:**
- **Backgrounds:** Pure black (#000000) or brand-bg (#0A0A0A)
- **Text:** brand-text (#FAFAFA) primary, brand-secondary (#A3A3A3) secondary
- **Borders:** brand-border (#262626) - subtle, 1px
- **Accent:** brand-primary (#8B5CF6) - Elite tier features, CTAs, highlights
- **Never:** Bright colors, gradients (except Elite purple gradient), color for decoration

---

## LAYOUT & SPACING

### Grid System

```css
/* Container widths */
--container-sm: 640px;   /* Mobile */
--container-md: 768px;   /* Tablet */
--container-lg: 1024px;  /* Desktop */
--container-xl: 1280px;  /* Wide desktop */
--container-2xl: 1536px; /* Ultra-wide */

/* Content max-width for readability */
--prose-width: 65ch;     /* ~650px at 16px */
```

### Spacing Scale (8pt grid)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Layout Principles

1. **White Space:** Generous padding/margin (minimum 24px between sections)
2. **Borders:** 1px solid, subtle (#262626), never thick
3. **Centering:** Use max-w-* + mx-auto for centered content blocks
4. **Asymmetry:** Acceptable, but intentional
5. **Cards:** Border only, no shadows, no rounded corners (or subtle 2px)

---

## UI COMPONENTS

### Buttons

```css
/* Primary CTA */
.btn-primary {
  background: var(--brand-primary);
  color: var(--white);
  padding: 0.75rem 1.5rem;
  font-family: 'Futura', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  transition: background 200ms;
}

.btn-primary:hover {
  background: var(--purple-600);
}

/* Secondary (outlined) */
.btn-secondary {
  background: transparent;
  color: var(--brand-text);
  padding: 0.75rem 1.5rem;
  font-family: 'Futura', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--brand-border);
  transition: border-color 200ms;
}

.btn-secondary:hover {
  border-color: var(--brand-primary);
}
```

### Form Inputs

```css
.input {
  background: var(--brand-bg);
  color: var(--brand-text);
  border: 1px solid var(--brand-border);
  padding: 0.75rem 1rem;
  font-family: 'Garamond', serif;
  font-size: 0.875rem;
  line-height: 1.5;
  transition: border-color 200ms;
}

.input:focus {
  outline: none;
  border-color: var(--brand-primary);
}

.input::placeholder {
  color: var(--brand-muted);
}
```

### Cards

```css
.card {
  background: var(--brand-bg);
  border: 1px solid var(--brand-border);
  padding: 2rem;
}

/* No box-shadow */
/* No border-radius (or max 2px if needed) */
```

### Data Display

```css
/* Stat blocks */
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-family: 'Futura', sans-serif;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-secondary);
}

.stat-value {
  font-family: 'Didot', serif;
  font-size: 2rem;
  color: var(--brand-text);
  letter-spacing: -0.01em;
}
```

---

## DESIGN PRINCIPLES

### 1. Minimal Editorial

**Like:** High-fashion magazines (Vogue, Dazed), art gallery websites
**Not Like:** Music streaming apps (Spotify, Apple Music)

- Generous white space
- High contrast (black/white)
- Typography as primary design element
- Sparse use of color
- Grid-based layouts

### 2. Cultural Authenticity

- Proper attribution to Black, Caribbean, African diasporic origins
- Name pioneers (Frankie Knuckles, King Tubby, Fela Kuti)
- Cite locations (Chicago, Jamaica, Detroit, London)
- Historical accuracy in lineages

### 3. Data as Design

- Let numbers speak (123 BPM, 4,152 tracks, 73% coherence)
- Visualizations: minimalist, line-based, no chartjunk
- Tables: clean, well-spaced, Futura headers

### 4. Elite Tier Signaling

**Visual cues for Elite features:**
- Purple accent color (brand-primary)
- "Elite Feature" label in Futura uppercase
- Subtle gradient backgrounds (purple-950/20)
- Not locked/paywalled feel - aspirational, not restrictive

---

## INTERACTION DESIGN

### Motion & Animation

**Principles:**
- Subtle, functional, not decorative
- 200ms transitions for color changes
- No bounce, no elastic, linear or ease-out only
- Loading states: simple spinner or pulsing text

```css
/* Standard transition */
transition: all 200ms ease-out;

/* Hover states */
.hover-lift:hover {
  transform: translateY(-1px);
}

/* No complex animations */
/* No parallax */
/* No auto-play carousels */
```

### User Feedback

**Success:**
- Checkmark (✓) in brand-primary
- Brief "Saved" text, no toast notifications

**Error:**
- Red text (--error)
- Clear, specific error message
- No exclamation points

**Loading:**
- Subtle spinner or "Loading..." text
- No skeleton screens (too busy)

---

## CONTENT GUIDELINES

### Writing Style

**Headings:**
```markdown
✅ Your Taste Spectrum
✅ Influence Genealogy
✅ Cultural Lineage

❌ Your Amazing Music Taste! 🎵
❌ Discover Your Unique Sound
❌ Explore Your Musical Journey
```

**Body Copy:**
```markdown
✅ Your taste traces: Disco (1970s) → Detroit Techno → Jersey Club.
   Lineage properly attributed to Black American club culture.

❌ You have an incredible and unique taste in music that spans
   multiple genres and shows your passion for diverse sounds!
```

**Calls to Action:**
```markdown
✅ Upgrade to Elite
✅ Analyze Catalog
✅ Train Your Voice

❌ Upgrade Now!
❌ Try It Today!
❌ Get Started!
```

### Numerical Precision

- Always show specific numbers: "4,152 tracks" not "thousands of tracks"
- Percentages to 1 decimal: 73.5%, not 73%
- BPM as integers: 123 BPM, not 123.45 BPM
- Dates/eras: "1981" or "1980s", not "early 80s"

---

## ICONOGRAPHY

**Style:** Line-based, minimal, 1-2px stroke
**Library:** Heroicons (outline variant)
**Usage:** Sparingly, functional only (not decorative)

**Approved Icons:**
- Check/X (status)
- Arrow (direction)
- Play/Pause (audio)
- Upload/Download (actions)
- Settings/Info (UI)

**Never:**
- Emoji
- Colorful icons
- Filled/solid icons (except checkmarks)
- Decorative illustrations

---

## ACCESSIBILITY

### Contrast Ratios (WCAG AA Minimum)

- **Text on black (#000000):**
  - Primary text (#FAFAFA): 18.4:1 ✓
  - Secondary text (#A3A3A3): 6.8:1 ✓
  - Muted text (#737373): 4.5:1 ✓

- **Purple primary (#8B5CF6) on black:** 4.8:1 ✓

### Best Practices

1. **Keyboard Navigation:** All interactive elements accessible via Tab
2. **Screen Readers:** Semantic HTML, proper ARIA labels
3. **Focus States:** Visible focus ring (brand-primary outline)
4. **Text Resize:** Responsive to browser zoom up to 200%
5. **Color Independence:** Never use color alone to convey meaning

---

## RESPONSIVE DESIGN

### Breakpoints

```css
/* Mobile-first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Mobile Considerations

- **Typography:** Scale down display sizes by 25-30%
- **Spacing:** Reduce padding by 25-50%
- **Touch Targets:** Minimum 44x44px for buttons
- **Stack:** Grid → Stack on mobile
- **Hide:** Non-essential content on small screens

---

## IMPLEMENTATION CHECKLIST

When adding new features, verify:

- [ ] Typography: Didot (display) + Garamond (body) + Futura (labels)
- [ ] Colors: 90% monochrome, 5% purple, 5% semantic
- [ ] Spacing: 8pt grid, generous padding (min 24px)
- [ ] Borders: 1px solid, subtle (#262626)
- [ ] Voice: Direct, no fluff, no emojis
- [ ] Cultural: Proper attribution to Black/Caribbean/African origins
- [ ] Data: Specific numbers, precise formatting
- [ ] Elite Features: Purple accent, "Elite Feature" label
- [ ] Accessibility: WCAG AA contrast, keyboard nav
- [ ] Mobile: Responsive, touch-friendly

---

## EXAMPLES

### ✅ GOOD - Matches Brand

```jsx
<div className="border border-brand-border p-6">
  <p className="uppercase-label text-brand-secondary mb-3">
    Your Taste Spectrum
  </p>

  <div className="space-y-4">
    <div className="border-l-2 border-brand-primary pl-4">
      <h4 className="text-display-sm text-brand-text mb-1">
        Jersey Club
      </h4>
      <p className="text-body-xs text-brand-secondary leading-relaxed">
        Black American club culture - Brick Bandits, Newark
      </p>
      <div className="flex gap-4 text-body-xs text-brand-muted mt-2">
        <span>144 BPM</span>
        <span>•</span>
        <span>42.9%</span>
      </div>
    </div>
  </div>
</div>
```

### ❌ BAD - Violates Brand

```jsx
<div className="rounded-lg shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 p-4">
  <h3 className="text-2xl font-bold text-white mb-2">
    🎵 Your Amazing Music Taste! 🎵
  </h3>
  <p className="text-white">
    Wow! You have such a unique and incredible sound!
    Click here to discover more about your musical journey! 🚀
  </p>
  <button className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-full mt-4">
    Try It Now! →
  </button>
</div>
```

---

## BRAND ESSENCE

**In Three Words:** Minimal. Editorial. Earned.

**Cultural References:**
- Dazed & Confused magazine
- Monolithic Undertow (book on bass music)
- Resident Advisor (RA.CO)
- Boiler Room (early era)
- MoMA exhibit labels

**NOT:**
- Spotify
- Apple Music
- Generic music tech
- Startup aesthetic
- Mass market streaming

**The User Should Feel:**
- Sophisticated, not marketed to
- Culturally literate, not pandered to
- Elite, not exclusive
- Informed, not overwhelmed

---

**Last Updated:** 2026-02-05
**Applies To:** All UI components, copy, features, marketing materials
