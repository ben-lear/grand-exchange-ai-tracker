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
          orange: '#FF7000',
          yellow: '#FFFF00',
          gold: '#FFD700',
        },
      },
    },
  },
  plugins: [],
}
