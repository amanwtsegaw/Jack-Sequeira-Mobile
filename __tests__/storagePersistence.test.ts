import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultStorageState,
  saveStorageState,
  loadStorageState,
} from '../src/storage';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
test('large content is saved in bounded writes, settings skip cache rewrites, and user data survives reload', async () => {
  await AsyncStorage.clear();
  const state = {
    ...defaultStorageState,
    notes: { chapter: 'Keep my note' },
    remoteCache: {
      ...defaultStorageState.remoteCache,
      seriesCatalogs: {},
      lessons: {},
    },
  };
  // A large catalog description models the content previously copied on every save.
  state.remoteCache.updatedAt = '😀'.repeat(200000);
  await saveStorageState(state);
  const writes = (AsyncStorage.setItem as jest.Mock).mock.calls;
  expect(writes.every(([, value]) => value.length <= 65536)).toBe(true);
  expect(
    JSON.parse(
      (await AsyncStorage.getItem('jack-sequeira-mobile-state')) as string,
    ).remoteCache,
  ).toBeUndefined();
  const before = writes.length;
  await saveStorageState({
    ...state,
    readerSettings: {
      ...state.readerSettings,
      fontScale: 1.3,
      lineHeight: 2.4,
    },
  });
  expect((AsyncStorage.setItem as jest.Mock).mock.calls.length - before).toBe(
    1,
  );
  const loaded = await loadStorageState();
  expect(loaded.remoteCache.updatedAt).toBe(state.remoteCache.updatedAt);
  expect(loaded.notes.chapter).toBe('Keep my note');
  expect(loaded.readerSettings.fontScale).toBe(1.3);
  expect(loaded.readerSettings.lineHeight).toBe(2.4);
});

test('first launch asks for a language and preserves the choice before onboarding completes', async () => {
  await AsyncStorage.clear();
  const fresh = await loadStorageState();
  expect(fresh.hasChosenLanguage).toBe(false);
  expect(fresh.hasSeenOnboarding).toBe(false);
  await saveStorageState({
    ...fresh,
    hasChosenLanguage: true,
    readerSettings: { ...fresh.readerSettings, readingLanguage: 'am' },
  });
  const restored = await loadStorageState();
  expect(restored.hasChosenLanguage).toBe(true);
  expect(restored.hasSeenOnboarding).toBe(false);
  expect(restored.readerSettings.readingLanguage).toBe('am');
});

test('existing users do not have to choose a language again', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'jack-sequeira-mobile-state',
    JSON.stringify({
      hasSeenOnboarding: true,
      readerSettings: { readingLanguage: 'ru' },
    }),
  );
  const restored = await loadStorageState();
  expect(restored.hasChosenLanguage).toBe(true);
  expect(restored.readerSettings.readingLanguage).toBe('ru');
});
