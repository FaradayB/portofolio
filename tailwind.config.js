/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'term-bg': '#0d1117',
        'term-surface': '#161b22',
        'term-green': '#00ff88',
        'term-blue': '#58a6ff',
        'term-fg': '#e6edf3',
        'term-muted': '#8b949e',
        'term-border': '#30363d',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'green-glow': '0 0 20px rgba(0, 255, 136, 0.25)',
      },
    },
  },
  plugins: [],
}
