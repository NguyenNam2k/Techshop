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
  
        'slate-900': '#0f172a',
        'cyber-cyan': '#06b6d4',
        'neon-violet': '#8b5cf6',
        'electric-blue': '#38bdf8',
        'vivid-purple': '#a78bfa',
      },
    },
  },
  plugins: [],
}