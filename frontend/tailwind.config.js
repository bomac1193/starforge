/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: '#0F0F1A',
        glow: '#A882FF',
        mint: '#26FFE6',
        text: '#F4F4F4',
        muted: '#6C6C80',
      },
      fontFamily: {
        header: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide: '0.05em',
        wider: '0.1em',
      },
      maxWidth: {
        'container': '960px',
      },
    },
  },
  plugins: [],
}
