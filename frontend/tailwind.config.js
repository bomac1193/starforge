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
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '56px', fontWeight: '500' }],
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '500' }],
        'display-md': ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'heading': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '300' }],
        'label': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.05em' }],
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
