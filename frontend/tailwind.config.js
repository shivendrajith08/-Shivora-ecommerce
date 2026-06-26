/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Navy backgrounds
        base: {
          DEFAULT: '#020818',
          soft:    '#060D22',
        },
        surface: {
          DEFAULT: '#060D22',
          raised:  '#0A1535',
          border:  'rgba(245,158,11,0.12)',
        },

        // Marigold — primary CTA
        gold: {
          DEFAULT: '#F59E0B',
          hover:   '#D97706',
          muted:   'rgba(245,158,11,0.12)',
          light:   '#FDE68A',
          deep:    '#B45309',
        },

        // Terracotta — secondary / sale accents
        terracotta: {
          DEFAULT: '#E07A5F',
          hover:   '#C4603F',
          muted:   'rgba(224,122,95,0.12)',
        },

        // Highlight — stars, badges
        highlight: '#FCD34D',

        // Text
        parchment: '#F4F4F2',

        // Muted / UI greys
        silver: {
          lightest: '#E2E8F0',
          light:    '#CBD5E1',
          DEFAULT:  '#94A3B8',
          muted:    '#94A3B8',
          dim:      '#64748B',
        },
      },

      backgroundImage: {
        'gold-shine':       'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
        'gold-shine-hover': 'linear-gradient(135deg, #FEF3C7 0%, #D97706 100%)',
        'gold-shine-press': 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
