export const theme = {
  colors: {
    background: '#201a15',
    foreground: '#f8f1e3',
    surfaceLowest: 'rgba(255, 248, 233, 0.06)',
    surfaceLow: 'rgba(255, 248, 233, 0.08)',
    surfaceHigh: 'rgba(255, 248, 233, 0.12)',
    outline: 'rgba(255,255,255,0.14)',
    outlineVariant: 'rgba(255,255,255,0.12)',
    primary: '#d9b260',
    primaryContainer: '#7a613e',
    primarySolid: '#d29c35',
    onPrimary: '#fff7e8',
    muted: '#b6ab99',
    mutedStrong: '#cbbcab',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
  radius: {
    md: 10,
    lg: 14,
    xl: 20,
  },
  fonts: {
    reading: 'Georgia',
    ui: 'System',
  },
} as const;
