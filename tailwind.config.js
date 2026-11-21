/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          dark: '#070913',
          card: '#0e1326',
          border: '#1f294d',
          neonCyan: '#00f3ff',
          neonPurple: '#a855f7',
          neonPink: '#ec4899',
          neonGreen: '#10b981',
          neonRed: '#ef4444',
          neonYellow: '#f59e0b',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace', 'ui-monospace'],
      }
    },
  },
  plugins: [],
}
