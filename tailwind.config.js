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
        'gm-navy': '#0A1F44',     
        'gm-gold': '#D4AF37',     
        'gm-charcoal': '#1C1C1E', 
        'gm-white': '#FFFFFF',
      },
      fontFamily: {
        'oswald-semibold': ['Oswald-SemiBold'],
        'montserrat-bold': ['Montserrat-Bold'],
        'montserrat-extrabold': ['Montserrat-ExtraBold'],
        'roboto-regular': ['Roboto-Regular'],
      },
    },
  },
  plugins: [],
};
