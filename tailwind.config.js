/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        surface: 'var(--tw-surface)',
        'surface-light': 'var(--tw-surface-light)',
        onSurface: 'var(--tw-on-surface)',
        accent: 'var(--tw-accent)',
        divider: 'var(--tw-divider)',
        
        // Brand pills (unchanged)
        'pickle-dark': '#000000',
        'muted-green': '#839c84',
        'pickle-text-muted': '#A1A1AA',
        'ppa-blue': '#3B82F6',
        'app-cyan': '#00c2c7',
        'mlp-orange': '#FB9062',
        'npl-lime-green': '#A3E635',
        'brick-red': '#EF4444',
        'ppa-challenger-burgundy': '#F43F5E',
        'lab-pink': '#e88ca1',
        'ptap-blue': '#25A6E5',
        'oap-green': '#4ADE80',
        'fight-yellow': '#FACC15',
      },
      fontFamily: {
        'mont': ['var(--font-mont)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}