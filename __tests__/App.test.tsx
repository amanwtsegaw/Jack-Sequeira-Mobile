/**
 * @format
 */

import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({children}: {children?: React.ReactNode}) => (
      <ReactNative.View>{children}</ReactNative.View>
    ),
  };
});

import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  SafeAreaView: ({children}: {children: React.ReactNode}) => {
    const ReactNative = require('react-native');
    return <ReactNative.View>{children}</ReactNative.View>;
  },
}));

jest.mock('../src/storage', () => ({
  defaultStorageState: {
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
  },
  loadStorageState: jest.fn().mockResolvedValue({
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
  }),
  saveStorageState: jest.fn(),
}));

jest.mock('@react-native-community/blur', () => {
  const ReactNative = require('react-native');
  return {
    BlurView: ({children}: {children?: React.ReactNode}) => (
      <ReactNative.View>{children}</ReactNative.View>
    ),
  };
});

jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('react-native-track-player', () => {
  const state = {None: 'none', Playing: 'playing', Paused: 'paused'};
  return {
    __esModule: true,
    default: {
      registerPlaybackService: jest.fn(),
      setupPlayer: jest.fn().mockResolvedValue(undefined),
      updateOptions: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      skip: jest.fn().mockResolvedValue(undefined),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      seekTo: jest.fn().mockResolvedValue(undefined),
      seekBy: jest.fn().mockResolvedValue(undefined),
      setRate: jest.fn().mockResolvedValue(undefined),
      skipToNext: jest.fn().mockResolvedValue(undefined),
      skipToPrevious: jest.fn().mockResolvedValue(undefined),
    },
    Capability: {
      Play: 'play',
      Pause: 'pause',
      SeekTo: 'seekTo',
      SkipToNext: 'skipToNext',
      SkipToPrevious: 'skipToPrevious',
    },
    State: state,
    useActiveTrack: jest.fn().mockReturnValue(undefined),
    usePlaybackState: jest.fn().mockReturnValue({state: state.None}),
    useProgress: jest.fn().mockReturnValue({position: 0, duration: 0, buffered: 0}),
  };
});

jest.mock('react-native-webview', () => {
  const ReactNative = require('react-native');
  return {
    WebView: ({children}: {children?: React.ReactNode}) => (
      <ReactNative.View>{children}</ReactNative.View>
    ),
  };
});

test('renders archive home experience', async () => {
  let tree: renderer.ReactTestRenderer | undefined;

  await renderer.act(async () => {
    tree = renderer.create(<App />);
  });

  expect(
    tree!.root.findByProps({children: 'Faith-centered archive'}),
  ).toBeTruthy();

  await renderer.act(async () => {
    tree!.unmount();
  });
});
