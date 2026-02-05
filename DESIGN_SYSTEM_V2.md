# Starforge Design System V2
## Elite Tastemaker Aesthetic

**Psychographic:** Elite DJ, Supermodel, Tastemaker
**References:** Paris, New York, Chic, Timeless
**Avoid:** SaaS, Vibecoded, Playful, Neon

---

## Typography

### Primary Fonts (Free & Licensed)

**Headers:**
- **Playfair Display** (Google Fonts - Free)
  - Elegant, editorial, Didot-inspired
  - Use for H1, H2, brand moments
  - Weights: 400, 500, 700

**Body:**
- **Inter** (Google Fonts - Free)
  - Clean, modern, readable
  - Use for body text, UI elements
  - Weights: 300, 400, 500, 600

**Alternative Pairing:**
- **Cormorant Garamond** (Headers) + **DM Sans** (Body)
- **Libre Bodoni** (Headers) + **Work Sans** (Body)

### Type Scale

```
H1: 48px / 56px (Playfair Display 500)
H2: 32px / 40px (Playfair Display 500)
H3: 24px / 32px (Playfair Display 400)
H4: 18px / 28px (Inter 500)

Body Large: 16px / 24px (Inter 400)
Body: 14px / 20px (Inter 400)
Body Small: 12px / 18px (Inter 300)

Label: 11px / 16px (Inter 500, uppercase, tracking 0.5px)
```

---

## Color Palette

### Monochrome Foundation

**Light Theme (Primary):**
```
Background: #FAFAFA (Off-white)
Surface: #FFFFFF (Pure white)
Text Primary: #0A0A0A (Near black)
Text Secondary: #6A6A6A (Medium gray)
Border: #E0E0E0 (Light gray)
```

**Dark Theme (Alternative):**
```
Background: #0A0A0A (Near black)
Surface: #1A1A1A (Charcoal)
Text Primary: #FAFAFA (Off-white)
Text Secondary: #8A8A8A (Medium gray)
Border: #2A2A2A (Dark gray)
```

### Accent (Minimal Use)

**Single Accent:**
```
Accent: #2A2A2A (Charcoal) on light
Accent: #FAFAFA (Off-white) on dark
```

**Optional Subtle Color:**
```
Success: #2A4A2A (Forest green - very muted)
Warning: #4A4A2A (Olive - very muted)
Error: #4A2A2A (Burgundy - very muted)
```

### NO:
- ❌ Neon colors
- ❌ Bright purples, cyans, magentas
- ❌ Gradients
- ❌ Glows

---

## Spacing

**8px base unit**

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

---

## Components

### Buttons

**Primary:**
```css
background: #0A0A0A
color: #FAFAFA
border: 1px solid #0A0A0A
padding: 12px 24px
font: Inter 500, 14px
letter-spacing: 0.5px
text-transform: uppercase
transition: 150ms ease

hover:
  background: #1A1A1A
  border: #1A1A1A
```

**Secondary:**
```css
background: transparent
color: #0A0A0A
border: 1px solid #E0E0E0
padding: 12px 24px
font: Inter 500, 14px
letter-spacing: 0.5px
text-transform: uppercase

hover:
  border: #0A0A0A
```

### Cards

```css
background: #FFFFFF
border: 1px solid #E0E0E0
padding: 24px
border-radius: 0 (NO rounded corners - sharp edges)
```

### Inputs

```css
background: #FAFAFA
border: 1px solid #E0E0E0
padding: 12px 16px
font: Inter 400, 14px

focus:
  border: #0A0A0A
  outline: none
```

---

## Layout Principles

1. **Generous Whitespace** - Don't cram, let it breathe
2. **Sharp Edges** - No rounded corners (or minimal 2px max)
3. **Thin Borders** - 1px only
4. **Alignment** - Strict grid alignment
5. **Asymmetry** - Editorial layouts, not centered SaaS boxes
6. **Minimalism** - Remove everything unnecessary

---

## UI Rules

### DO:
- ✓ Clean lines
- ✓ Generous padding
- ✓ Subtle hover states
- ✓ Monochrome first
- ✓ Editorial hierarchy
- ✓ High contrast text

### DON'T:
- ✗ Emojis
- ✗ Bright colors
- ✗ Rounded corners (or max 2px)
- ✗ Shadows (or very subtle 1px)
- ✗ Gradients
- ✗ Playful copy

---

## Audio Section (Compact Design)

### Layout

**Single unified section** instead of 3 separate cards:

```
┌─────────────────────────────────────────┐
│ AUDIO ANALYSIS                          │
├─────────────────────────────────────────┤
│                                         │
│ [Rekordbox]  [Upload Files]  [Analyze] │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Drag & drop audio or collection.xml │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ • 12 tracks uploaded                    │
│ • Rekordbox: 1,234 tracks imported      │
│ • Analysis: 85% avg quality             │
│                                         │
└─────────────────────────────────────────┘
```

Compact, minimal, unified.

---

## Example Component (Button)

**Before (Vibecoded):**
```jsx
<button className="bg-mint text-cosmic px-8 py-4 rounded-full font-bold glow-effect">
  🎵 Analyze Audio
</button>
```

**After (Chic):**
```jsx
<button className="bg-black text-white px-6 py-3 border border-black uppercase text-xs tracking-wider font-medium hover:bg-neutral-900 transition-colors">
  Analyze Audio
</button>
```

---

## References

**Editorial:**
- The Face Magazine
- Vogue Paris
- Harper's Bazaar
- Document Journal

**Fashion:**
- Rick Owens
- Jil Sander
- The Row
- Byredo

**Digital:**
- SSENSE
- Aesop
- Need Supply (RIP)
- Kinfolk (pre-2020)

---

**Aesthetic Keywords:**
Minimal, Editorial, Monochrome, Timeless, Sharp, Clean, Sophisticated, Understated, Precise, Refined
