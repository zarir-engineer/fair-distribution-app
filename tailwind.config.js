// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          100: '#f5f5f5',
          400: '#6b7280', // darken this
        },
        background: '#ffffff',
        foreground: '#171717',
      },
    },
  },
  plugins: [],
}