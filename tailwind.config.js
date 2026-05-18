/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[class~="qf-dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        bg:       'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2:       'var(--surface-2)',
          3:       'var(--surface-3)',
        },
        line: {
          DEFAULT: 'var(--line)',
          2:       'var(--line-2)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2:       'var(--ink-2)',
          3:       'var(--ink-3)',
          4:       'var(--ink-4)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          2:       'var(--teal-2)',
          tint:    'var(--teal-tint)',
          ink:     'var(--teal-ink)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          2:       'var(--coral-2)',
          tint:    'var(--coral-tint)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          tint:    'var(--amber-tint)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
          tint:    'var(--blue-tint)',
        },
        success: {
          DEFAULT: 'var(--success)',
          tint:    'var(--success-tint)',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': '20px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      keyframes: {
        'qf-pulse': {
          '0%':   { boxShadow: '0 0 0 0 currentColor', opacity: '1' },
          '70%':  { boxShadow: '0 0 0 6px transparent', opacity: '1' },
          '100%': { boxShadow: '0 0 0 0 transparent', opacity: '1' },
        },
        'qf-shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'qf-pulse':   'qf-pulse 2s ease-out infinite',
        'qf-shimmer': 'qf-shimmer 1.4s ease infinite',
      },
    },
  },
  plugins: [],
}
