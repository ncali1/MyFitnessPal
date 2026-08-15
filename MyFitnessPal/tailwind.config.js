/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors: {
        canvas: {
          DEFAULT: '#0a0b0f',
          950: '#050508',
          900: '#0a0b0f',
          800: '#121319',
          700: '#181a22',
        },
        surface: {
          DEFAULT: '#15171f',
          hover: '#1c1e28',
          border: '#262835',
        },
        accent: {
          DEFAULT: '#ff5a2b',
          50: '#fff1ec',
          100: '#ffe0d3',
          400: '#ff7a4d',
          500: '#ff5a2b',
          600: '#ea4413',
          700: '#c2340c',
        },
        lime: {
          DEFAULT: '#c6ff5e',
          400: '#d4ff85',
          500: '#c6ff5e',
          600: '#a3e639',
        },
        ink: {
          DEFAULT: '#f5f6f8',
          muted: '#9a9ea9',
          faint: '#656975',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(255,90,43,0.4), 0 0 24px -4px rgba(255,90,43,0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
