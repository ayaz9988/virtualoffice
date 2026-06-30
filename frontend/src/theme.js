import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        magenta: {
          50: { value: '#fdf2f8' },
          100: { value: '#fce7f3' },
          200: { value: '#fbcfe8' },
          300: { value: '#f9a8d4' },
          400: { value: '#f472b6' },
          500: { value: '#ec4899' },
          600: { value: '#db2777' },
          700: { value: '#be185d' },
          800: { value: '#9d174d' },
          900: { value: '#831843' },
          950: { value: '#500724' },
        },
      },
    },
    semanticTokens: {
      colors: {
        'accent': { DEFAULT: { _light: 'magenta.500', _dark: 'magenta.400' } },
        'accent.fg': { DEFAULT: { _light: 'white', _dark: 'white' } },
        'accent.muted': { DEFAULT: { _light: 'magenta.100', _dark: 'magenta.900' } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
