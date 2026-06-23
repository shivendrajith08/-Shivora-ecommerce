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

        // Gold — warm metallic; use gold-shine / gold-shine-hover gradients for buttons
        gold: {
          light:   '#F0D98A', // gold-light   — focus rings, highlights
          hover:   '#E0BE6A', // gold-hover   — button hover tint, gradient start
          DEFAULT: '#C9A24B', // gold         — primary CTA colour, icons, text accents
          dark:    '#B8932F', // gold-dark    — gradient end, active/pressed state
          deep:    '#9A7A22', // gold-deep    — darkest; shadows, border on gold elements
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
        'gold-shine':       'linear-gradient(135deg, #E0BE6A 0%, #B8932F 100%)',
        'gold-shine-hover': 'linear-gradient(135deg, #F0D98A 0%, #C9A24B 100%)',
        'gold-shine-press': 'linear-gradient(135deg, #C9A24B 0%, #9A7A22 100%)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
