/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#060a12',
          900: '#0c1222',
          850: '#11192e',
          800: '#19243f',
        }
      }
    },
  },
  plugins: [],
}
