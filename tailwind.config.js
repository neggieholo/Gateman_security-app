/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'gm-navy': '#0A1F44',     // From your brand guide
        'gm-gold': '#D4AF37',     // From your brand guide
        'gm-charcoal': '#1C1C1E', // From your brand guide
        'gm-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
};
