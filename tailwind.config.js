// tailwind.config.js (formato ES Module)

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        anton: ['"Anton"', 'sans-serif'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        impact: ['Impact', 'sans-serif'], 
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('tailwind-scrollbar'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwind-scrollbar-hide')
  ],
};