/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark Mode exact surface hierarchy
        darkBg: '#070A0E',
        darkSidebar: '#05070A',
        darkCard: '#0E131A',
        darkElevated: '#151B23',
        darkBorder: '#273241',
        darkText: '#F5F7FA',
        darkMuted: '#94A3B8',

        // Light Mode exact surface hierarchy
        lightBg: '#F7F7F4',
        lightCard: '#FFFFFF',
        lightText: '#0B0D10',

        // Final StockSense Accents
        electricBlue: {
          DEFAULT: '#1769FF',
          hover: '#0052E0',
          light: 'rgba(23, 105, 255, 0.1)',
        },
        stockOrange: {
          DEFAULT: '#FF7A00',
          hover: '#E06B00',
          light: 'rgba(255, 122, 0, 0.1)',
        },
        stockGreen: '#16A34A',
        stockYellow: '#F59E0B',
        stockRed: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px rgba(0, 0, 0, 0.4)',
        'neo-blue': '3px 3px 0px 0px #1769FF',
        'neo-orange': '3px 3px 0px 0px #FF7A00',
      }
    },
  },
  plugins: [],
}
