/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — see DESIGN_NOTES.md for rationale.
        // Warm, calm palette chosen for a cancer-care audience: no clinical
        // cold blues, no low-contrast grays. One confident accent (teal),
        // one warm alert accent (used sparingly), warm near-black text.
        canvas: '#FBF8F2',      // warm off-white background
        surface: '#FFFFFF',     // card surfaces
        ink: '#2A2420',         // warm near-black — primary text (not gray)
        inkSoft: '#5B5148',     // secondary text, still high-contrast (>4.5:1 on canvas)
        line: '#E4DACB',        // warm hairline border, not cool gray
        teal: {
          DEFAULT: '#116466',
          dark: '#0B4B4C',
          light: '#DCEEEE',
        },
        clay: {
          DEFAULT: '#B5563C',   // warm accent for alerts / secondary emphasis
          light: '#F5E1D8',
        },
        gold: {
          DEFAULT: '#8A6D1F',
          light: '#F3E9CF',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        base: ['18px', '28px'],
        lg: ['20px', '30px'],
        xl: ['22px', '32px'],
        '2xl': ['26px', '34px'],
        '3xl': ['32px', '40px'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
