// tailwind.config.js (formato ES Module)

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
        tactical: ['"JetBrains Mono"', '"Roboto Mono"', 'ui-monospace', 'monospace'],
        anton: ['"Anton"', 'sans-serif'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        impact: ['Impact', 'sans-serif'],
      },
      colors: {
        'dark-pure': '#000000',
        'dark-panel': '#111111',
        'dark-border': '#2a2a2a',
        'brand-primary': '#f1c40f',
        'ops-void': '#05070f',
        'ops-panel': '#141929',
        'ops-neon': '#10b981',
        'ops-alert': '#eab308',
        'ops-metal': '#94a3b8',
      },
      backgroundImage: {
        'ops-grid': `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'ops-grid': '28px 28px',
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