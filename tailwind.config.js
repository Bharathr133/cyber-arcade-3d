/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Base Monochrome Palette (Linear / Stripe / Notion Enterprise Clean)
        base: {
          50:  '#FAFAFA',  // page background
          100: '#F4F4F5',  // sidebar / surface subtle
          200: '#E4E4E7',  // hairline borders & dividers
          400: '#A1A1AA',  // muted text / mono metadata
          600: '#52525B',  // secondary body text
          900: '#18181B',  // headings / primary charcoal text
        },
        // Single Accent Blue (Primary CTAs only)
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        // System Status
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
