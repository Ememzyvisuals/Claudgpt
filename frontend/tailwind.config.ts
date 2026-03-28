import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // var(--font-display) = Plus Jakarta Sans via next/font
        // var(--font-sans)    = Sora via next/font  
        // var(--font-mono)    = JetBrains Mono via next/font
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-sans)',    'Sora',              'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'JetBrains Mono',    'monospace'],
        body:    ['var(--font-sans)',    'Sora',              'system-ui', 'sans-serif'],
      },
      colors: {
        primary:   { DEFAULT: '#C4A484', dark: '#a8896a', light: '#dcc9b0', faint: '#f0e8df' },
        secondary: { DEFAULT: '#8B7B6B', light: '#a89585' },
        brown: {
          50: '#faf6f2', 100: '#f0e8df', 200: '#dcc9b0', 300: '#C4A484',
          400: '#a8896a', 500: '#8B7B6B', 600: '#6d5e51', 700: '#4f4439',
          800: '#332b24', 900: '#1a1410',
        },
        surface: { DEFAULT: '#FFFFFF', soft: '#FAFAF8', muted: '#F5F2EF', hover: '#EDE8E2' },
        border:  { DEFAULT: '#E8E0D6', strong: '#C4A484' },
        ink:     { DEFAULT: '#1A1410', muted: '#6B5D52', faint: '#A89585' },
      },
      borderRadius: {
        '2xl': '16px', '3xl': '20px', '4xl': '28px',
      },
      boxShadow: {
        'soft-sm':   '0 1px 3px rgba(139,123,107,0.08), 0 1px 2px rgba(139,123,107,0.06)',
        'soft-md':   '0 4px 16px rgba(139,123,107,0.10), 0 2px 6px rgba(139,123,107,0.07)',
        'soft-lg':   '0 12px 40px rgba(139,123,107,0.14), 0 4px 12px rgba(139,123,107,0.08)',
        'primary':   '0 4px 20px rgba(196,164,132,0.35)',
        'primary-lg':'0 8px 32px rgba(196,164,132,0.45)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'blink':    'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                               to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' },     to: { opacity: '1', transform: 'scale(1)' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
    },
  },
  plugins: [],
};
export default config;
