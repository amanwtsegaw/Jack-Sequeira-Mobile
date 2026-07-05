import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fontChoices,
  readingLanguageChoices,
  themeChoices,
  type FontChoice,
  type ReadingLanguage,
  type ThemeMode,
} from './design';

const STORAGE_KEY = 'jack-sequeira-mobile-state';

function isFontChoice(value: unknown): value is FontChoice {
  return fontChoices.some(choice => choice.id === value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return themeChoices.some(choice => choice.id === value);
}

function isReadingLanguage(value: unknown): value is ReadingLanguage {
  return readingLanguageChoices.some(choice => choice.id === value);
}

export type ReaderSettings = {
  fontScale: 0.9 | 0.98 | 1.06 | 1.14 | 1.22 | 1.3;
  lineHeight: 1.45 | 1.6 | 1.75 | 1.9 | 2.05 | 2.2;
  themeMode: ThemeMode;
  fontChoice: FontChoice;
  readingLanguage: ReadingLanguage;
};

export type LessonHighlight = {
  id: string;
  text: string;
  createdAt: string;
  color?: string;
  style?: 'highlight' | 'underline';
  note?: string;
};

export type StorageState = {
  readerSettings: ReaderSettings;
  favorites: string[];
  recents: string[];
  progress: Record<
    string,
    {
      ratio: number;
      updatedAt: string;
    }
  >;
  notes: Record<string, string>;
  highlights: Record<string, LessonHighlight[]>;
};

export const defaultStorageState: StorageState = {
  readerSettings: {
    fontScale: 1.06,
    lineHeight: 1.75,
    themeMode: 'dark',
    fontChoice: 'original',
    readingLanguage: 'en',
  },
  favorites: [],
  recents: [],
  progress: {},
  notes: {},
  highlights: {},
};

export async function loadStorageState(): Promise<StorageState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultStorageState;
    }

    const parsed = JSON.parse(raw) as Partial<StorageState>;
    const parsedSettings: Partial<ReaderSettings> = parsed.readerSettings ?? {};
    const fontChoice = isFontChoice(parsedSettings.fontChoice)
      ? parsedSettings.fontChoice
      : defaultStorageState.readerSettings.fontChoice;
    const themeMode = isThemeMode(parsedSettings.themeMode)
      ? parsedSettings.themeMode
      : defaultStorageState.readerSettings.themeMode;
    const readingLanguage = isReadingLanguage(parsedSettings.readingLanguage)
      ? parsedSettings.readingLanguage
      : defaultStorageState.readerSettings.readingLanguage;
    return {
      readerSettings: {
        ...defaultStorageState.readerSettings,
        ...parsedSettings,
        fontChoice,
        themeMode,
        readingLanguage,
      },
      favorites: parsed.favorites ?? [],
      recents: parsed.recents ?? [],
      progress: parsed.progress ?? {},
      notes: parsed.notes ?? {},
      highlights: parsed.highlights ?? {},
    };
  } catch {
    return defaultStorageState;
  }
}

export async function saveStorageState(state: StorageState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is useful but should not block reading.
  }
}
