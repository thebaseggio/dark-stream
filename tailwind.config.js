// tailwind.config.js (formato ES Module)

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
        anton: ['"Anton"', 'sans-serif'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        impact: ['Impact', 'sans-serif'], 
      },
      colors: {
        'dark-pure': '#000000',
        'dark-panel': '#111111',
        'dark-border': '#2a2a2a',
        'brand-primary': '#f1c40f',
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