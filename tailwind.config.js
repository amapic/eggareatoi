/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'menu': {
          DEFAULT: '#3b82f6',  // couleur principale
          'light': '#60a5fa',  // version plus claire
          'dark': '#2563eb',   // version plus foncée
          'greyy': '#9ca3af',
        },
      },
    },
  },
  plugins: [],
} 