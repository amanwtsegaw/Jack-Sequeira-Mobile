import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type ArchiveLesson,
  type ArchiveSeries,
} from './data/archive';
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
  remoteCache: RemoteContentCache;
  downloadedAudio: Record<string, DownloadedAudioItem>;
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

export type RemoteContentCache = {
  updatedAt: string | null;
  seriesCatalogs: Partial<Record<ReadingLanguage, ArchiveSeries[]>>;
  series: Record<string, ArchiveSeries>;
  lessons: Record<string, ArchiveLesson>;
};

export type DownloadedAudioItem = {
  id: string;
  collectionKey: string;
  fileName: string;
  title: string;
  reference: string;
  localPath: string;
  bytes: number;
  downloadedAt: string;
};

export const defaultStorageState: StorageState = {
  readerSettings: {
    fontScale: 1.06,
    lineHeight: 1.75,
    themeMode: 'dark',
    fontChoice: 'original',
    readingLanguage: 'en',
  },
  remoteCache: {
    updatedAt: null,
    seriesCatalogs: {},
    series: {},
    lessons: {},
  },
  downloadedAudio: {},
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
      remoteCache: normalizeRemoteCache(parsed.remoteCache),
      downloadedAudio: normalizeDownloadedAudio(parsed.downloadedAudio),
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

export function getRemoteCacheByteSize(cache: RemoteContentCache) {
  try {
    return JSON.stringify(cache).length;
  } catch {
    return 0;
  }
}

export function getDownloadedAudioByteSize(
  downloadedAudio: Record<string, DownloadedAudioItem>,
) {
  return Object.values(downloadedAudio).reduce(
    (sum, item) => sum + Math.max(0, item.bytes || 0),
    0,
  );
}

function normalizeRemoteCache(
  value: Partial<RemoteContentCache> | undefined,
): RemoteContentCache {
  return {
    updatedAt:
      typeof value?.updatedAt === 'string' ? value.updatedAt : null,
    seriesCatalogs:
      value?.seriesCatalogs && typeof value.seriesCatalogs === 'object'
        ? value.seriesCatalogs
        : {},
    series:
      value?.series && typeof value.series === 'object' ? value.series : {},
    lessons:
      value?.lessons && typeof value.lessons === 'object'
        ? value.lessons
        : {},
  };
}

function normalizeDownloadedAudio(
  value: Partial<Record<string, DownloadedAudioItem>> | undefined,
): Record<string, DownloadedAudioItem> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce<Record<string, DownloadedAudioItem>>(
    (items, [key, item]) => {
      if (
        item &&
        typeof item.id === 'string' &&
        typeof item.collectionKey === 'string' &&
        typeof item.fileName === 'string' &&
        typeof item.title === 'string' &&
        typeof item.reference === 'string' &&
        typeof item.localPath === 'string' &&
        typeof item.downloadedAt === 'string'
      ) {
        items[key] = {
          ...item,
          bytes: typeof item.bytes === 'number' ? item.bytes : 0,
        };
      }

      return items;
    },
    {},
  );
}
