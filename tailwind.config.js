/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        '2k': '1920px',  // Adjust this value as needed for your 2K screens
        '4k': '3840px',  // Typically the width for a 4K display
      },
      maxWidth: {
        'screen-2k': '1900px',
        'screen-4k': '3700px',
      },
    },
  },
  plugins: [],
}