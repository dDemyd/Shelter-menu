/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        shelter: {
          bg: '#0d0d0d',
          'bg-2': '#161513',
          surface: 'rgba(245,241,232,0.04)',
          'surface-2': 'rgba(245,241,232,0.07)',
          line: 'rgba(245,241,232,0.10)',
          'line-2': 'rgba(245,241,232,0.18)',
          text: '#f5f1e8',
          muted: '#8a857a',
          'muted-2': '#5a564f',
          accent: '#ff5a1f',
          'accent-ink': '#0d0d0d',
        },
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '4px',
        md: '6px',
        lg: '10px',
      },
      letterSpacing: {
        wider: '0.08em',
        widest: '0.16em',
      },
      animation: {
        'pulse-dot': 'pulseDot 2.4s ease-in-out infinite',
        'fab-in': 'fabIn 220ms cubic-bezier(0.2,0.8,0.2,1)',
        'slide-up': 'slideUp 280ms cubic-bezier(0.2,0.8,0.2,1)',
        'fade-in': 'fadeIn 180ms ease-out',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { transform: 'scale(1)', opacity: 0.9 },
          '50%': { transform: 'scale(1.3)', opacity: 1 },
        },
        fabIn: {
          '0%': { transform: 'scale(0.6) translateY(20px)', opacity: 0 },
          '100%': { transform: 'scale(1) translateY(0)', opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-shadow-neon': {
          textShadow:
            '0 0 12px rgba(255,90,31,0.55), 0 0 30px rgba(255,90,31,0.25)',
        },
        '.glow-orange': {
          boxShadow:
            '0 8px 28px rgba(255,90,31,0.45), 0 0 14px rgba(255,90,31,0.35)',
        },
        '.glow-orange-soft': {
          boxShadow: '0 0 18px rgba(255,90,31,0.45)',
        },
        '.inset-glow': {
          boxShadow: 'inset 0 0 10px rgba(255,90,31,0.35)',
        },
        '.hazard-stripe': {
          backgroundImage:
            'repeating-linear-gradient(-45deg, #ff5a1f 0 14px, #0d0d0d 14px 28px)',
          opacity: '0.85',
          filter: 'drop-shadow(0 0 8px rgba(255,90,31,0.55))',
        },
        '.concrete-noise': {
          position: 'relative',
        },
        '.tabular-nums': {
          fontVariantNumeric: 'tabular-nums',
        },
      })
    }),
  ],
}
