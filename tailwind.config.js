/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Dark navy theme: neutral classes keep their names but resolve to dark-blue surfaces and light text.
        stone: {
          50: '#0e1f3b',
          100: '#0a1628',
          200: '#16294a',
          300: '#24416b',
          400: '#3c5a88',
          500: '#5f7aa3',
          600: '#9bb0cf',
          700: '#c3d1e6',
          800: '#dbe5f3',
          900: '#f1f5fb',
        },
        white: '#132340',
        teal: {
          50: '#0b2236',
          100: '#0d2b44',
          200: '#113a5c',
          300: '#17507c',
          400: '#1f6a9e',
          500: '#0ea5e9',
          600: '#38bdf8',
          700: '#7dd3fc',
          800: '#bae6fd',
          900: '#e0f2fe',
        },
        amber: {
          50: '#2a1f08',
          200: '#5c4310',
          700: '#fcd34d',
          800: '#fde68a',
        },
        rose: {
          50: '#2a0f17',
          200: '#5c1f33',
          700: '#fda4af',
          800: '#fecdd3',
        },
      },
    },
  },
  plugins: [],
};
