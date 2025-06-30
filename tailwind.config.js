module.exports = {
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
    require('@tailwindcss/aspect-ratio')
  ],
};