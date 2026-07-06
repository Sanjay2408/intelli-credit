/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text',
          'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        accent: {
          DEFAULT: '#0071e3',
          hover: '#0077ed',
          soft: '#eaf3fe',
        },
        ink: {
          DEFAULT: '#1d1d1f',
          soft: '#6e6e73',
          faint: '#86868b',
        },
        surface: {
          DEFAULT: '#f5f5f7',
          card: '#ffffff',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        lift: '0 8px 30px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
