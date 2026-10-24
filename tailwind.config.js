/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Specified SafeSphere Premium Color Palette
        brand: {
          teal: '#0F9D8A',       // Primary teal
          deepTeal: '#087F73',   // Deep teal
          violet: '#7457F5',     // Electric violet
          lavender: '#EEE9FF',   // Soft lavender
          aqua: '#DDF8F1',       // Light aqua
          coral: '#FF6B6B',      // Warm coral
          peach: '#FFF0E8',      // Soft peach
          bg: '#F8FAFC',         // Main background
          card: '#FFFFFF',       // White cards
          text: '#20243A',       // Primary text
          muted: '#697386',      // Secondary text
          border: '#E7EAF1',     // Borders
        },
        teal: {
          50: '#F0FDF9',
          100: '#DDF8F1', // Light aqua
          200: '#B2EFE2',
          300: '#7FE2CF',
          400: '#2EC2AB',
          500: '#0F9D8A', // Primary teal
          600: '#087F73', // Deep teal
          700: '#06635A',
          800: '#064E47',
          900: '#06413C',
        },
        violet: {
          50: '#F8F6FF',
          100: '#EEE9FF', // Soft lavender
          200: '#DCD4FF',
          300: '#BFB0FF',
          400: '#9B84FB',
          500: '#7457F5', // Electric violet
          600: '#5E3DE8',
          700: '#4D2ECC',
          800: '#3E25A3',
          900: '#331F83',
        },
        coral: {
          50: '#FFF5F5',
          100: '#FFF0E8', // Soft peach
          200: '#FFD7D7',
          300: '#FFB3B3',
          400: '#FF8A8A',
          500: '#FF6B6B', // Warm coral
          600: '#EB4D4D',
          700: '#C73636',
          800: '#A42A2A',
          900: '#872525',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E7EAF1',
          300: '#D8DEE9',
          muted: '#697386',
          text: '#20243A',
          card: '#FFFFFF',
        },
        navy: {
          950: '#0F172A',
          900: '#1E293B',
          850: '#26344E',
          800: '#334155',
          700: '#475569',
          600: '#64748B',
        },
        slate: {
          850: '#1E293B',
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
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        card: '0 2px 8px -1px rgba(32, 36, 58, 0.06), 0 1px 4px -1px rgba(32, 36, 58, 0.04)',
        elevated: '0 10px 25px -3px rgba(32, 36, 58, 0.08), 0 4px 10px -2px rgba(32, 36, 58, 0.04)',
        hover: '0 14px 30px -4px rgba(32, 36, 58, 0.12), 0 6px 12px -3px rgba(32, 36, 58, 0.06)',
        teal: '0 8px 20px -4px rgba(15, 157, 138, 0.35)',
        violet: '0 8px 20px -4px rgba(116, 87, 245, 0.35)',
        coral: '0 8px 20px -4px rgba(255, 107, 107, 0.35)',
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
