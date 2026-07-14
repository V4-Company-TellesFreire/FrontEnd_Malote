import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Typography ──────────────────────────────────────────────
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },

      // ─── Colors (semantic tokens) ────────────────────────────────
      colors: {
        brand: {
          DEFAULT: '#1F3F77',
          50:  '#EDF0F4',
          100: '#D7DCE7',
          200: '#AAB6CB',
          300: '#7D90B0',
          400: '#4C6592',
          500: '#1F3F77',
          600: '#1C386B',
          700: '#172F5B',
          800: '#12264A',
          900: '#0E1D3A',
        },
        accent: {
          DEFAULT: '#1B9AAA',
          50:  '#E6F7F9',
          100: '#CCEFF3',
          200: '#99DFE7',
          300: '#66CFDB',
          400: '#33BFCF',
          500: '#1B9AAA',
          600: '#167E8B',
          700: '#11616C',
          800: '#0C454D',
          900: '#07282E',
        },
        highlight: {
          DEFAULT: '#FFC20E',
          50:  '#FFFAEC',
          100: '#FFF4D4',
          200: '#FFE8A3',
          300: '#FFDC73',
          400: '#FFCE3E',
          500: '#FFC20E',
          600: '#DAA60E',
          700: '#A9820D',
          800: '#785D0D',
          900: '#47380C',
        },

        // Semantic status
        success: {
          DEFAULT: '#0D9F6F',
          50:  '#ECFDF3',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#0D9F6F',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#DC8C0A',
          50:  '#FEF7E0',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#DC8C0A',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        critical: {
          DEFAULT: '#D92B4B',
          50:  '#FEF0F3',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#D92B4B',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
        info: {
          DEFAULT: '#2E7CF6',
          50:  '#EEF4FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2E7CF6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Malote shifts
        malote: {
          manha:        '#FFC20E',
          'manha-light':'#FFFAEC',
          tarde:        '#2E7CF6',
          'tarde-light':'#EEF4FF',
          noite:        '#7C4DFF',
          'noite-light':'#F3EEFF',
        },

        // Neutral scale
        neutral: {
          50:  '#F8FAFB',
          100: '#F0F3F5',
          200: '#E2E7EC',
          300: '#C8D0D9',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        // Surface aliases
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFB',
          tertiary:  '#F0F3F5',
        },
      },

      // ─── Border Radius ───────────────────────────────────────────
      borderRadius: {
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        full: '9999px',
      },

      // ─── Shadows ─────────────────────────────────────────────────
      boxShadow: {
        xs:  '0 1px 2px rgba(15,23,42,.04)',
        sm:  '0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)',
        md:  '0 4px 12px rgba(15,23,42,.07), 0 2px 4px rgba(15,23,42,.04)',
        lg:  '0 10px 24px rgba(15,23,42,.1), 0 4px 8px rgba(15,23,42,.05)',
        xl:  '0 20px 40px rgba(15,23,42,.12), 0 8px 16px rgba(15,23,42,.06)',
      },

      // ─── Spacing (inherits Tailwind 4px base) ────────────────────
      // Using Tailwind's default 0.25rem (4px) base, which already matches our spec.

      // ─── Z-Index Scale ───────────────────────────────────────────
      zIndex: {
        dropdown:  '100',
        sticky:    '200',
        overlay:   '300',
        modal:     '400',
        popover:   '500',
        toast:     '600',
      },

      // ─── Animations ─────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        'slide-in-bottom': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-urgency': {
          '0%, 100%': { boxShadow: '0 1px 3px rgba(15,23,42,.06)' },
          '50%':      { boxShadow: '0 0 0 3px rgba(217,43,75,.12)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(16px)' },
          to:   { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        'fade-in':         'fade-in 200ms ease-out',
        'fade-out':        'fade-out 200ms ease-out',
        'slide-in-bottom': 'slide-in-bottom 250ms ease-out',
        'slide-in-right':  'slide-in-right 200ms ease-out',
        'scale-in':        'scale-in 250ms ease-out',
        'pulse-urgency':   'pulse-urgency 2s ease-in-out infinite',
        'toast-in':        'toast-in 300ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
