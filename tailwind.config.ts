import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      backgroundImage: {
        'tubeshapes-dark': "url('/images/Adamant-bg-dark.png')",
        'tubeshapes-light': "url('/images/Adamant-bg-light.png')",
      },
      colors: {
        adamant: {
          accentText: '#A78E5A',
          accentBg: '#cfd0d2',
          dark: '#8A754A',
          contrastDark: '#3F331D',
          gradientBright: '#A68C57',
          gradientDark: '#B59D6B',
          background: '#151321',
          box: {
            dark: '#0C0C20',
            veryDark: '#0B0B16',
            regular: '#2a2835',
            light: '#0D0C22',
            buttonDark: '#100F20',
            buttonLight: '#151426',
            border: '#313131',
          },
          app: {
            box: '#272632',
            boxHighlight: '#444a5f',
            input: '#10131f',
            inputBorder: '#404040',
            selectTrigger: '#232631',
            buttonDisabled: '#999ca4',
          },
          button: {
            box: {
              gradientA: '#e9e9ea',
              gradientB: '#c6c6c7',
            },
            form: {
              main: '#ffffff',
              secondary: '#232631',
            },
          },
          text: {
            box: {
              main: '#ffffff',
              secondary: '#819dae',
            },
            form: {
              main: '#ffffff',
              secondary: '#929499',
            },
            button: {
              box: '#1a1836',
              form: {
                main: '#000000',
                secondary: '#ffffff',
              },
            },
          },
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;
