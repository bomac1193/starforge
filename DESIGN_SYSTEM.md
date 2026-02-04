# 🎨 Starforge Design System

## Philosophy

Starforge is designed for **artist-founders in flow state**. Every pixel protects their glow.

The aesthetic is:
- **Cosmic minimalism** (not sterile, not cluttered)
- **Neon ritual** (functional mysticism)
- **Energy-aware** (UI responds to user state)

---

## Color Palette

### Primary Colors

```
#0F0F1A  Cosmic       ████████  Background, void, depth
#A882FF  Glow         ████████  Primary actions, moderate energy
#26FFE6  Mint         ████████  Secondary actions, optimal state
#F4F4F4  Text         ████████  Body text, readable content
#6C6C80  Muted        ████████  Low-energy, disabled, borders
```

### Color Usage Matrix

| Element | Optimal | Moderate | Overload | Disabled |
|---------|---------|----------|----------|----------|
| **Glowmeter** | Mint | Glow | Glow (pulsing) | Muted |
| **CTA** | Mint | Glow | Glow | Muted |
| **Status** | Mint bg | Glow bg | Glow border | Muted |
| **Phase** | Mint fill | Glow fill | — | Muted border |

### Gradient Usage

Only use gradients for:
- Loading states
- Active glow effects
- Twin voice nudges

Example:
```css
background: linear-gradient(135deg, #A882FF 0%, #26FFE6 100%);
```

---

## Typography

### Font Stack

```
Headers:  Satoshi Bold → Inter ExtraBold → sans-serif
Body:     General Sans Regular → Inter Regular → sans-serif
```

### Scale

| Element | Size | Weight | Tracking | Line Height |
|---------|------|--------|----------|-------------|
| H1 | 2.5-3rem | 800 | 0.1em | 1.2 |
| H2 | 2-2.5rem | 800 | 0.05em | 1.3 |
| H3 | 1.5-2rem | 700 | normal | 1.4 |
| Body | 1rem | 400 | normal | 1.6 |
| Small | 0.875rem | 400 | normal | 1.5 |

### Usage

- **H1**: Page title, hero moments
- **H2**: Section headers
- **H3**: Card titles, phase names
- **Body**: Descriptions, copy, captions
- **Small**: Metadata, timestamps, labels

---

## Spacing System

Based on 4px grid:

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### Component Spacing

- **Card padding**: 1.5rem (24px)
- **Button padding**: 0.75rem 1.5rem (12px 24px)
- **Section gap**: 2rem (32px)
- **Container max-width**: 960px
- **Outer margin**: 1.5rem (24px)

---

## Components

### Buttons

#### Primary (Glow)
```jsx
<button className="btn-primary">
  Generate Twin OS
</button>
```
- Background: `#A882FF`
- Text: `#0F0F1A`
- Hover: 90% opacity
- Padding: 12px 24px
- Border radius: 8px

#### Secondary (Mint)
```jsx
<button className="btn-secondary">
  Plan / Adjust Drop
</button>
```
- Border: 2px `#26FFE6`
- Text: `#26FFE6`
- Hover: fill with mint, text becomes cosmic
- Padding: 12px 24px
- Border radius: 8px

### Cards

```jsx
<div className="card">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

- Background: `#0F0F1A`
- Border: 1px `#6C6C80`
- Border radius: 12px
- Padding: 24px

**Active state:**
- Border: 1px `#A882FF`
- Add `glow-effect` class

### Input Fields

```jsx
<input className="input-field" />
```

- Background: `#0F0F1A`
- Border: 1px `#6C6C80`
- Border radius: 8px
- Padding: 12px 16px
- Focus: border becomes `#A882FF`

### File Upload Zones

```jsx
<div className="border-2 border-dashed border-muted hover:border-glow">
  Drop files here
</div>
```

- Border: 2px dashed `#6C6C80`
- Padding: 32px
- Hover: border becomes `#A882FF`
- Active drag: border becomes `#A882FF`, background `#A882FF` 10% opacity

---

## Animations

### Transitions

Default transition:
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Keyframes

#### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Pulse Glow
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(168, 130, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(168, 130, 255, 0.5);
  }
}
```

### Usage Rules

- Page transitions: `fadeIn` 300ms
- Glow effects: `pulse-glow` 3s infinite
- Hover: 200ms
- Active/focus: 150ms

---

## Layout

### Grid System

Single-column, centered:

```jsx
<div className="max-w-container mx-auto px-6">
  {/* Content */}
</div>
```

- Max width: 960px
- Horizontal padding: 24px
- Vertical sections: 48px gap

### Responsive Breakpoints

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
```

**Mobile-first approach:**
- Default: mobile (single column, smaller text)
- md+: desktop (larger text, more spacing)

---

## States

### Energy States

| Glow Level | UI Response |
|------------|-------------|
| **5** | Mint accents, "Ready to forge" |
| **4** | Mint accents, "Optimal capacity" |
| **3** | Glow accents, "Moderate energy" |
| **2** | Glow accents, Twin nudge appears |
| **1** | Glow accents, Twin nudge appears, auto-suggest low-energy mode |

### Capacity States

| Load | Color | Status |
|------|-------|--------|
| **0-59%** | Mint | Optimal |
| **60-79%** | Glow | Moderate |
| **80-100%** | Glow (pulsing) | Overload |

---

## Icons & Emojis

Use emojis sparingly for semantic meaning:

- 🌌 Brand (Starforge)
- 🎵 Audio files
- 📅 Calendar events
- ✓ Completed tasks
- → List items / suggestions
- ● Active state

**Never use:**
- Generic smiley faces
- Decorative emojis
- More than one emoji per line

---

## Voice & Tone

### The Twin's Voice

The Twin OS speaks in brief, poetic nudges:

**Examples:**
- "Glow low. Ritual compressed."
- "Clarity is returning. Let's forge ahead."
- "Overload detected. The Twin suggests reducing scope."

**Rules:**
- Maximum 2 sentences
- Present tense
- No questions
- No exclamation marks (except rare moments of celebration)
- Refer to itself in third person ("The Twin suggests...")

### UI Copy

**Button text:**
- Active voice
- No articles ("Generate Twin OS", not "Generate the Twin OS")
- Brief (2-4 words ideal)

**Descriptions:**
- Direct, clear
- Avoid jargon unless artist-specific
- Use "you" not "we"

**Error messages:**
- Calm, helpful
- Suggest solution
- No blame

---

## Accessibility

### Contrast Ratios

All text meets WCAG AA standards:

- Text (#F4F4F4) on Cosmic (#0F0F1A): 14.8:1 ✓
- Glow (#A882FF) on Cosmic (#0F0F1A): 6.2:1 ✓
- Mint (#26FFE6) on Cosmic (#0F0F1A): 11.4:1 ✓

### Focus States

All interactive elements must have visible focus:

```css
.btn-primary:focus {
  outline: 2px solid #26FFE6;
  outline-offset: 2px;
}
```

### Screen Readers

- Use semantic HTML (`<nav>`, `<main>`, `<section>`)
- Add `aria-label` to icon-only buttons
- Mark decorative elements with `aria-hidden="true"`

---

## Do's and Don'ts

### ✅ Do

- Use single-column layouts
- Keep CTAs visible and accessible
- Show energy state at all times
- Use generous white space
- Animate state changes
- Provide immediate feedback

### ❌ Don't

- Use multiple columns for primary content
- Hide critical actions in menus
- Use generic stock imagery
- Overcomplicate navigation
- Use red for errors (use glow with calm tone)
- Auto-play audio/video

---

**Every design decision protects the artist's flow state.**
