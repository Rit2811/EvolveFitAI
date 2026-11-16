/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wellness: {
          background: '#F5F4F0',
          surface: '#FFFFFF',
          primary: '#0F766E',
          accent: '#0891B2',
          text: '#172B40',
          muted: '#586779',
          border: '#DCE3E7',
          ink: '#142B43',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: { card: '0 8px 28px rgba(20, 43, 67, 0.05)' },
    },
  },
  plugins: [],
}
