# Typography Setup Guide

## Current Status

✅ **Fraunces** - Fully implemented via Google Fonts
⚠️ **Söhne** - Fallback to Helvetica Neue (commercial font, needs to be added)

---

## Adding Söhne Font Files

Söhne is a commercial font from [Klim Type Foundry](https://klim.co.nz/retail-fonts/sohne/).

### Required Weights

You need these specific weights:

- **Söhne Buch** (Book/Regular 400) - for body text and UI
- **Söhne Medium** (500) - for secondary headings (H5, H6)
- **Söhne Halbfett** (Semibold 600) - for secondary headings (H4)

### Installation Steps

1. **Purchase Söhne** from Klim Type Foundry or obtain license
2. **Create fonts directory**:
   ```bash
   mkdir -p public/fonts/sohne
   ```

3. **Add font files** to `public/fonts/sohne/`:
   ```
   public/fonts/sohne/
   ├── Sohne-Buch.woff2
   ├── Sohne-Buch.woff
   ├── Sohne-Medium.woff2
   ├── Sohne-Medium.woff
   ├── Sohne-Halbfett.woff2
   └── Sohne-Halbfett.woff
   ```

4. **Add @font-face declarations** in `src/App.css`:

   ```css
   /* Söhne Font Family */
   @font-face {
     font-family: 'Söhne';
     src: url('/fonts/sohne/Sohne-Buch.woff2') format('woff2'),
          url('/fonts/sohne/Sohne-Buch.woff') format('woff');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }

   @font-face {
     font-family: 'Söhne';
     src: url('/fonts/sohne/Sohne-Medium.woff2') format('woff2'),
          url('/fonts/sohne/Sohne-Medium.woff') format('woff');
     font-weight: 500;
     font-style: normal;
     font-display: swap;
   }

   @font-face {
     font-family: 'Söhne';
     src: url('/fonts/sohne/Sohne-Halbfett.woff2') format('woff2'),
          url('/fonts/sohne/Sohne-Halbfett.woff') format('woff');
     font-weight: 600;
     font-style: normal;
     font-display: swap;
   }
   ```

5. **Restart development server**:
   ```bash
   npm start
   ```

---

## Typography Hierarchy

### 1. Primary Headings (H1-H3) - **Fraunces**

**Role**: Presence · Naming · Orientation

**When to use**:
- Names a page or section
- Establishes context
- Sets tone before content
- Should be felt before read

**Examples**:
- "THRESHOLD"
- "Trajectories"
- "Sources"
- "Rights & Ledger"

**Rules**:
- Short (1-6 words ideally)
- No paragraphs
- No explanation
- NO ALL CAPS (use sentence case)
- Regular (400) or Semibold (600) ONLY

**Classes**:
```jsx
<h1 className="heading-primary-xl">Threshold</h1>
<h2 className="heading-primary-lg">Trajectories</h2>
<h3 className="heading-primary-md">Sources</h3>
```

---

### 2. Secondary Headings (H4-H6) - **Söhne Halbfett/Medium**

**Role**: Structural labels, not expressive moments

**When to use**:
- Explains how something works
- Introduces a block of information
- Groups content
- Functions as UI guidance

**Examples**:
- "How Access Works"
- "The Agreement"
- "The Return"
- "Available Sources"
- "Revenue Distribution"

**Rules**:
- Sentence case
- Clear, literal language
- Slightly tighter line-height than body
- Medium (500) or Halbfett (600) only

**Classes**:
```jsx
<h4 className="heading-structural-lg">How Access Works</h4>
<h5 className="heading-structural">The Agreement</h5>
<h6 className="heading-structural-sm">Available Sources</h6>
```

---

### 3. Body Text / UI Text - **Söhne Buch**

**Role**: Law, clarity, and trust

**Use for**:
- Paragraphs
- Explanations
- Descriptions
- Legal text
- Buttons
- Filters
- Metadata

**Classes**:
```jsx
<p className="body-lg">Large body text</p>
<p className="body">Default body text</p>
<p className="body-sm">Small body text</p>
<span className="ui-label">UI LABEL</span>
```

---

## Mental Model

| Element | Font | Question Answered |
|---------|------|-------------------|
| H1-H3 | Fraunces | "Where am I?" |
| H4-H6 | Söhne Halbfett/Medium | "What is this part?" |
| Body/UI | Söhne Buch | "What does it do?" |

---

## The One Rule That Ends All Debate

**If the text must be interpreted → Fraunces is FORBIDDEN**
**If the text must be obeyed or understood → Söhne ONLY**

This rule will never fail you.

---

## Common Mistakes to Avoid

### ❌ DON'T use Fraunces for:
- Feature descriptions
- Philosophy text
- Ethical claims
- Long statements

*That turns feeling into authority.*

### ❌ DON'T use Söhne Buch for:
- Page titles
- Major section names

*That flattens identity.*

### ❌ DON'T mix Fraunces and Söhne within the same heading

*This creates uncertainty about authority.*

---

## Tailwind Utilities

The system integrates with Tailwind:

```jsx
// Primary headings (Fraunces)
<h1 className="text-display-xl">...</h1>
<h2 className="text-display-lg">...</h2>
<h3 className="text-display-md">...</h3>

// Secondary headings (Söhne)
<h4 className="text-heading-lg">...</h4>
<h5 className="text-heading">...</h5>
<h6 className="text-heading-sm">...</h6>

// Body text (Söhne Buch)
<p className="text-body-lg">...</p>
<p className="text-body">...</p>
<p className="text-body-sm">...</p>

// Labels
<span className="text-label">...</span>
```

---

## Testing the System

After adding Söhne fonts, verify the setup:

1. Open browser DevTools
2. Inspect any heading element
3. Check computed font-family - should show "Söhne" not "Helvetica Neue"
4. Verify font weights:
   - Body text: 400 (Buch)
   - H5/H6: 500 (Medium)
   - H4: 600 (Halbfett)
   - H1/H2: 600 (Fraunces Semibold)
   - H3: 400 (Fraunces Regular)

---

## Alternative: Using a Similar Free Font

If you can't access Söhne, consider these grotesque sans-serifs:

- **Helvetica Neue** (system font, already fallback)
- **Inter** (free, already in project but more geometric)
- **IBM Plex Sans** (free, similar grotesque character)

To switch to IBM Plex Sans:
1. Update font imports in `index.css`
2. Replace `'Söhne'` with `'IBM Plex Sans'` in config files
