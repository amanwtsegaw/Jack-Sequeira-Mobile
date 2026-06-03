import AsyncStorage from '@react-native-async-storage/async-storage';
import type {FontChoice, ThemeMode} from './design';

const STORAGE_KEY = 'jack-sequeira-mobile-state';

export type ReaderSettings = {
  fontScale: 0.9 | 0.98 | 1.06 | 1.14 | 1.22 | 1.3;
  lineHeight: 1.45 | 1.6 | 1.75 | 1.9 | 2.05 | 2.2;
  themeMode: ThemeMode;
  fontChoice: FontChoice;
};

export type LessonHighlight = {
  id: string;
  text: string;
  createdAt: string;
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
    return {
      readerSettings: {
        ...defaultStorageState.readerSettings,
        ...parsed.readerSettings,
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
