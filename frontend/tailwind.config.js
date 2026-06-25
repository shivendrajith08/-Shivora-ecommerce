/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Existing light-theme tokens (kept for active components) ──────
        brand: {
          50:  '#f1f8ed',
          100: '#dff0d4',
          200: '#bfdfac',
          300: '#97c87f',
          400: '#6dac55',
          500: '#4d9136',
          600: '#3c7229',
          700: '#2d5620',
          800: '#1f3c15',
          900: '#12230c',
        },
        accent: {
          500: '#c1623f',
          600: '#a5502f',
          700: '#8a3f22',
          800: '#6f2f17',
          900: '#52200e',
        },

        // ── Dark gold-and-silver theme tokens ─────────────────────────────
        //
        // Backgrounds
        base: {
          DEFAULT: '#14130F', // bg-base          — deepest page bg
          soft:    '#1A1916', // bg-base-soft      — lifted layer (between base and surface)
        },
        surface: {
          DEFAULT: '#22201B', // bg-surface        — cards, panels, sidebars
          raised:  '#2C2921', // bg-surface-raised — modals, dropdowns, tooltips
          border:  '#3A3630', // border-surface-border — subtle dividers on dark
        },

        // Silver — metallic; use silver-shine gradients for buttons
        gold: {
          light:   '#E8E8E8', // silver-light   — focus rings, highlights
          hover:   '#D4D4D4', // silver-hover   — button hover tint, gradient start
          DEFAULT: '#C0C0C0', // silver         — primary CTA colour, icons, text accents
          dark:    '#A0A0A0', // silver-dark    — gradient end, active/pressed state
          deep:    '#808080', // silver-deep    — darkest; shadows, border on silver elements
        },

        // Silver — cool metallic; for borders, secondary UI, muted text
        silver: {
          lightest: '#E8EAED', // silver-lightest — table-header fills, tag backgrounds
          light:    '#D8DADE', // silver-light    — input borders, hairlines
          DEFAULT:  '#C0C2C5', // silver          — secondary borders, icon strokes
          muted:    '#A8AAAD', // silver-muted    — secondary/helper text
          dim:      '#8A8C8F', // silver-dim      — placeholders, disabled text
        },

        // Text
        parchment: '#F5F3EE', // text-parchment — primary near-white text (7.2:1 on base)
      },

      // Gold gradient utilities: bg-gold-shine, bg-gold-shine-hover
      backgroundImage: {
        'gold-shine':       'linear-gradient(135deg, #D4D4D4 0%, #A0A0A0 100%)',
        'gold-shine-hover': 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)',
        'gold-shine-press': 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
