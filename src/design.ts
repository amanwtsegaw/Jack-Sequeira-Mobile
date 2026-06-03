import {Platform} from 'react-native';

export const fontScaleOptions = [0.9, 0.98, 1.06, 1.14, 1.22, 1.3] as const;
export const lineHeightOptions = [1.45, 1.6, 1.75, 1.9, 2.05, 2.2] as const;

export const fontChoices = [
  {id: 'original', label: 'Original'},
  {id: 'georgia', label: 'Georgia'},
  {id: 'palatino', label: 'Palatino'},
  {id: 'baskerville', label: 'Baskerville'},
  {id: 'times', label: 'Times New Roman'},
  {id: 'system-serif', label: 'System Serif'},
] as const;

export type ThemeMode = 'dark' | 'sepia' | 'light';
export type FontChoice = (typeof fontChoices)[number]['id'];

export type AppPalette = {
  background: string;
  foreground: string;
  surfaceLowest: string;
  surfaceLow: string;
  surfaceHigh: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  primaryContainer: string;
  primarySolid: string;
  onPrimary: string;
  muted: string;
  mutedStrong: string;
  shadow: string;
  glowOne: string;
  glowTwo: string;
  glowThree: string;
  heroShade: string;
  highlight: string;
  blurTint: 'dark' | 'light';
  statusBar: 'light-content' | 'dark-content';
};

export type AppTypography = {
  ui: string;
  reading: string;
};

export const palettes: Record<ThemeMode, AppPalette> = {
  dark: {
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
    shadow: '#000000',
    glowOne: 'rgba(224, 190, 109, 0.16)',
    glowTwo: 'rgba(122, 97, 62, 0.22)',
    glowThree: 'rgba(244, 221, 160, 0.1)',
    heroShade: 'rgba(27, 22, 18, 0.42)',
    highlight: 'rgba(225, 191, 92, 0.28)',
    blurTint: 'dark',
    statusBar: 'light-content',
  },
  sepia: {
    background: '#f1e4cd',
    foreground: '#34261a',
    surfaceLowest: 'rgba(255, 249, 238, 0.68)',
    surfaceLow: 'rgba(255, 248, 233, 0.82)',
    surfaceHigh: 'rgba(255, 244, 224, 0.92)',
    outline: 'rgba(80, 58, 34, 0.14)',
    outlineVariant: 'rgba(80, 58, 34, 0.1)',
    primary: '#9d6c2e',
    primaryContainer: '#ead3ab',
    primarySolid: '#af7630',
    onPrimary: '#fff9f0',
    muted: '#7f6850',
    mutedStrong: '#604a34',
    shadow: '#9d825e',
    glowOne: 'rgba(196, 145, 78, 0.18)',
    glowTwo: 'rgba(170, 118, 58, 0.16)',
    glowThree: 'rgba(246, 224, 182, 0.36)',
    heroShade: 'rgba(246, 233, 210, 0.34)',
    highlight: 'rgba(195, 144, 65, 0.24)',
    blurTint: 'light',
    statusBar: 'dark-content',
  },
  light: {
    background: '#eef1f5',
    foreground: '#18222f',
    surfaceLowest: 'rgba(255, 255, 255, 0.72)',
    surfaceLow: 'rgba(255, 255, 255, 0.8)',
    surfaceHigh: 'rgba(255, 255, 255, 0.9)',
    outline: 'rgba(24,34,47,0.14)',
    outlineVariant: 'rgba(24,34,47,0.1)',
    primary: '#2c8f7a',
    primaryContainer: '#ccebe4',
    primarySolid: '#38ab8a',
    onPrimary: '#ffffff',
    muted: '#65707c',
    mutedStrong: '#44505c',
    shadow: '#7e8da3',
    glowOne: 'rgba(56, 171, 138, 0.16)',
    glowTwo: 'rgba(68, 121, 186, 0.14)',
    glowThree: 'rgba(183, 235, 220, 0.28)',
    heroShade: 'rgba(236, 244, 248, 0.3)',
    highlight: 'rgba(91, 215, 182, 0.26)',
    blurTint: 'light',
    statusBar: 'dark-content',
  },
};

export function resolveTypography(choice: FontChoice): AppTypography {
  switch (choice) {
    case 'georgia':
      return {ui: 'Georgia', reading: 'Georgia'};
    case 'palatino':
      return {
        ui: Platform.select({ios: 'Palatino', android: 'serif'}) ?? 'serif',
        reading: Platform.select({ios: 'Palatino', android: 'serif'}) ?? 'serif',
      };
    case 'baskerville':
      return {
        ui: Platform.select({ios: 'Baskerville', android: 'serif'}) ?? 'serif',
        reading: Platform.select({ios: 'Baskerville', android: 'serif'}) ?? 'serif',
      };
    case 'times':
      return {
        ui:
          Platform.select({ios: 'Times New Roman', android: 'serif'}) ?? 'serif',
        reading:
          Platform.select({ios: 'Times New Roman', android: 'serif'}) ?? 'serif',
      };
    case 'system-serif':
      return {
        ui: Platform.select({ios: 'Times New Roman', android: 'serif'}) ?? 'serif',
        reading: Platform.select({ios: 'Times New Roman', android: 'serif'}) ?? 'serif',
      };
    case 'original':
    default:
      return {
        ui: Platform.select({ios: 'Georgia', android: 'serif'}) ?? 'serif',
        reading: Platform.select({ios: 'Georgia', android: 'serif'}) ?? 'serif',
      };
  }
}

export function getStepValue<T extends readonly number[]>(options: T, index: number) {
  const safeIndex = Math.max(0, Math.min(options.length - 1, index));
  return options[safeIndex];
}

export function getValueIndex<T extends readonly number[]>(options: T, value: number) {
  const exactIndex = options.findIndex(option => option === value);
  return exactIndex >= 0 ? exactIndex : 0;
}
