/**
 * Shared Design Tokens for the Starforge Ecosystem
 *
 * Aesthetic: Architectural precision
 * - Canela for display, Söhne for body
 * - Sharp corners, no border-radius
 * - High contrast black/white base
 * - Spacing scale: 8/16/24/32/48/64/96
 */

export const colors = {
  // Base palette
  brand: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#0A0A0A',
    secondary: '#6A6A6A',
    border: '#E0E0E0',
  },

  // Tyrian Purple - historically accurate royal purple
  accent: {
    primary: '#66023C',
    hover: '#520230',
    subtle: 'rgba(102, 2, 60, 0.1)',
    text: '#66023C',
  },

  // Status colors
  status: {
    success: '#16A34A',
    error: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
  },

  // Semantic
  semantic: {
    positive: '#16A34A',
    negative: '#DC2626',
    neutral: '#6A6A6A',
  },
};

export const typography = {
  // Font families
  fonts: {
    display: 'Canela, Georgia, serif',
    body: 'Söhne, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },

  // Font sizes
  sizes: {
    'display-lg': '48px',
    'display-md': '32px',
    'display-sm': '24px',
    'heading-lg': '20px',
    'heading-sm': '18px',
    'body': '14px',
    'body-sm': '13px',
    'label': '11px',
  },

  // Line heights
  lineHeights: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },

  // Font weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Letter spacing
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.1em',
  },
};

export const spacing = {
  // Numeric scale (Tailwind-compatible)
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',

  // Named semantic scale (ecosystem-standard)
  xs: '8px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
  '2xl': '64px',
  '3xl': '96px',
};

export const borders = {
  width: {
    default: '1px',
    thick: '2px',
  },
  radius: {
    none: '0', // Sharp corners - the "blade" aesthetic
  },
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
};

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
};

// CSS custom properties generator
export function generateCSSVariables() {
  return `
:root {
  /* Colors - Brand */
  --color-brand-bg: ${colors.brand.bg};
  --color-brand-surface: ${colors.brand.surface};
  --color-brand-text: ${colors.brand.text};
  --color-brand-secondary: ${colors.brand.secondary};
  --color-brand-border: ${colors.brand.border};

  /* Colors - Accent (Tyrian Purple) */
  --color-accent: ${colors.accent.primary};
  --color-accent-hover: ${colors.accent.hover};
  --color-accent-subtle: ${colors.accent.subtle};

  /* Colors - Status */
  --color-success: ${colors.status.success};
  --color-error: ${colors.status.error};
  --color-warning: ${colors.status.warning};
  --color-info: ${colors.status.info};

  /* Typography — Canela + Söhne */
  --font-display: ${typography.fonts.display};
  --font-body: ${typography.fonts.body};
  --font-mono: ${typography.fonts.mono};

  /* Transitions */
  --transition-fast: ${transitions.duration.fast};
  --transition-normal: ${transitions.duration.normal};
  --transition-easing: ${transitions.easing.default};
}
`.trim();
}

export default {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  generateCSSVariables,
};
