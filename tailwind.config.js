/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DigiSakhi Official Final Brand Palette
        brand: {
          purple: '#5517C8',         // Royal Purple (Primary Brand)
          royalPurple: '#5517C8',
          deepPurple: '#351078',     // Deep Purple (Headings, Depth)
          electricBlue: '#365BFF',   // Electric Blue (Primary Gradient partner)
          blue: '#365BFF',
          brightCyan: '#08C9E8',     // Bright Cyan (Energetic Accents, Focus)
          cyan: '#08C9E8',
          lavender: '#F2EDFF',       // Soft Lavender (Nav active, Surface cards)
          paleBlue: '#EAF7FF',       // Pale Blue (Neutral informative badges)
          bg: '#FAF9FF',             // Main Canvas Background
          card: '#FFFFFF',           // Clean White
          text: '#211638',           // Primary Text (High contrast purple-charcoal)
          muted: '#716B80',          // Secondary Text
          border: '#E8E1F3',         // Borders
          green: '#16865C',          // Success Green (Confirmations, Connected)
          amber: '#C87912',          // Warning Amber (Pending, Caution)
          red: '#D92D45',            // Emergency Red (SOS, Urgent 112)

          // Compatibility Mappings ensuring 100% of existing components inherit the new palette:
          teal: '#5517C8',           // Mapped to Royal Purple
          deepTeal: '#351078',       // Mapped to Deep Purple
          violet: '#365BFF',         // Mapped to Electric Blue
          aqua: '#F2EDFF',           // Mapped to Soft Lavender
          coral: '#D92D45',          // Mapped to Emergency Red
          peach: '#FFF1F3',          // Mapped to Soft Pink/Lavender
        },
        purple: {
          50: '#FAF9FF',
          100: '#F2EDFF', // Soft lavender
          200: '#E2D6FF',
          300: '#C7B0FF',
          400: '#9E77F7',
          500: '#7B42EC',
          600: '#5517C8', // Royal purple
          700: '#4510AB',
          800: '#351078', // Deep purple
          900: '#260B57',
        },
        cyan: {
          50: '#F0FDFF',
          100: '#E0FAFE',
          200: '#BAF4FD',
          300: '#7CE9FB',
          400: '#34D6F5',
          500: '#08C9E8', // Bright cyan
          600: '#03A2C2',
          700: '#08809B',
          800: '#0E677C',
          900: '#115568',
        },
        surface: {
          50: '#FAF9FF',
          100: '#F2EDFF',
          200: '#E8E1F3',
          300: '#D5CDE3',
          muted: '#716B80',
          text: '#211638',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(33, 22, 56, 0.03), 0 1px 2px 0 rgba(33, 22, 56, 0.02)',
        card: '0 2px 10px -1px rgba(33, 22, 56, 0.05), 0 1px 4px -1px rgba(33, 22, 56, 0.03)',
        elevated: '0 12px 32px -4px rgba(33, 22, 56, 0.08), 0 4px 12px -2px rgba(33, 22, 56, 0.04)',
        hover: '0 16px 36px -4px rgba(85, 23, 200, 0.12), 0 6px 14px -3px rgba(33, 22, 56, 0.06)',
        purple: '0 8px 24px -4px rgba(85, 23, 200, 0.35)',
        blue: '0 8px 24px -4px rgba(54, 91, 255, 0.3)',
        cyan: '0 8px 20px -4px rgba(8, 201, 232, 0.35)',
        teal: '0 8px 24px -4px rgba(85, 23, 200, 0.35)', // mapped to purple shadow
        violet: '0 8px 24px -4px rgba(54, 91, 255, 0.3)',
        coral: '0 8px 24px -4px rgba(217, 45, 69, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
