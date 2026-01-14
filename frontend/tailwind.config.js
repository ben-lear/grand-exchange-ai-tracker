/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        osrs: {
          gold: '#FFD700',
          orange: '#FF9800',
          red: '#DC3545',
          green: '#28A745',
        },
      },
    },
  },
  plugins: [],
}
