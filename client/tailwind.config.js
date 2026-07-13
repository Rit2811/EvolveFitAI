/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wellness: {
          background: '#F5F7F2',
          surface: '#FFFFFF',
          primary: '#166534',
          accent: '#84CC16',
          text: '#18201B',
          muted: '#6B746D',
          border: '#E4E8E2',
        },
      },
      boxShadow: { card: '0 8px 30px rgba(24, 32, 27, 0.06)' },
    },
  },
  plugins: [],
}
