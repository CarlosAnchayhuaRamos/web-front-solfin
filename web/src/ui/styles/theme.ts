// src/ui/styles/theme.ts
// Design tokens – single source of truth for colors, fonts, spacing

export const theme = {
  colors: {
    blue: '#1b4ea1',
    red: '#ed1c24',
    yellow: '#fcf12e',
    dark: '#0a1628',
    darkBlue: '#0d2554',
    light: '#f0f4ff',
    white: '#ffffff',
    textMuted: 'rgba(255,255,255,0.65)',
    textBody: '#555555',
    whatsapp: '#25D366',
    whatsappHover: '#1ebe5d',
  },
  fonts: {
    display: "'Oswald', sans-serif",
    body: "'Montserrat', sans-serif",
  },
  shadows: {
    card: '0 4px 20px rgba(0,0,0,0.07)',
    cardHover: '0 16px 40px rgba(27,78,161,0.15)',
    whatsapp: '0 4px 20px rgba(37,211,102,0.5)',
  },
} as const;

export type Theme = typeof theme;
