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
      fontSize: {
        'scaled-2xl': '1.235rem',  // approx 35% smaller than 2xl (1.875rem)
        'scaled-xl': '1.04rem',    // approx 35% smaller than xl (1.6rem)
        'scaled-lg': '0.91rem',    // approx 35% smaller than lg (1.4rem)
        'scaled-base': '0.84rem',  // approx 35% smaller than base (1rem)
        'scaled-sm': '0.715rem',   // approx 35% smaller than sm (0.875rem)
        'scaled-xs': '0.65rem',    // approx 35% smaller than xs (0.75rem)
      },	
    },
  },
  plugins: [],
}
