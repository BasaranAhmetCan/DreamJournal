/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'white': 'rgba(var(--dream-white), <alpha-value>)',
        'dream-dark': 'rgba(var(--dream-dark), <alpha-value>)',
        'dream-mid': 'rgba(var(--dream-mid), <alpha-value>)',
        'dream-light': 'rgba(var(--dream-light), <alpha-value>)',
        'dream-accent': 'rgba(var(--dream-accent), <alpha-value>)',
        'pure-white': '#ffffff',
        'pure-black': '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
