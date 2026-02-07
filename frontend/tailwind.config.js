/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome palette
        'brand-bg': '#FAFAFA',
        'brand-surface': '#FFFFFF',
        'brand-text': '#0A0A0A',
        'brand-secondary': '#6A6A6A',
        'brand-border': '#E0E0E0',
        'brand-accent': '#2A2A2A',

        // Dark theme (alternative)
        'dark-bg': '#0A0A0A',
        'dark-surface': '#1A1A1A',
        'dark-text': '#FAFAFA',
        'dark-secondary': '#8A8A8A',
        'dark-border': '#2A2A2A',
      },
      fontFamily: {
        // PRIMARY HEADINGS (H1-H3): Presence, naming, orientation
        display: ['Canela', 'Georgia', 'serif'],

        // SECONDARY HEADINGS & BODY: Structural, operational, clear
        sans: ['Söhne', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // H1-H3: Canela (announces, never explains)
        'display-xl': ['48px', { lineHeight: '56px', fontWeight: '500' }], // H1 - Medium
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '500' }], // H2 - Medium
        'display-md': ['24px', { lineHeight: '32px', fontWeight: '400' }], // H3 - Regular

        // H4-H6: Söhne (structural labels, not expressive)
        'heading-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],  // H4 - Halbfett
        'heading': ['18px', { lineHeight: '26px', fontWeight: '500' }],      // H5 - Medium
        'heading-sm': ['16px', { lineHeight: '24px', fontWeight: '500' }],   // H6 - Medium

        // Body & UI: Söhne Buch (law, clarity, trust)
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],      // Buch
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],         // Buch
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],      // Buch
        'label': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.05em' }], // Medium
      },
      letterSpacing: {
        'wider': '0.05em',
        'widest': '0.1em',
      },
      maxWidth: {
        'container': '1200px',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
      },
    },
  },
  plugins: [],
}
