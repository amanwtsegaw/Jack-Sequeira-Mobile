import React from 'react';
import renderer from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import { State } from 'react-native-track-player';
import { AudioFullscreenPlayerModal } from '../src/app/components/MediaPlayer';
import { createStyles } from '../src/app/styles';
import { palettes, resolveAppTypography } from '../src/design';
jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('react-native-youtube-iframe', () => 'YoutubePlayer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: { pause: jest.fn() },
  State: {
    Playing: 'playing',
    Buffering: 'buffering',
    Loading: 'loading',
    Error: 'error',
    Paused: 'paused',
  },
}));
test('full-screen streaming player shows buffering spinner and uses a gradient glass background', async () => {
  const styles = createStyles(
    palettes.dark,
    resolveAppTypography('cabin', 'en'),
  );
  const props = {
    visible: true,
    styles,
    palette: palettes.dark,
    track: { title: 'Message', artist: 'Scripture' },
    progress: { position: 10, duration: 100, buffered: 15 },
    playbackRate: 1,
    onChangePlaybackRate: jest.fn(),
    onClose: jest.fn(),
  };
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <AudioFullscreenPlayerModal {...props} playbackState={State.Buffering} />,
    );
  });
  expect(tree.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  expect(
    tree.root.findByProps({ accessibilityLabel: 'Pause buffering audio' }),
  ).toBeTruthy();
  expect(styles.audioFullscreenSafeArea.experimental_backgroundImage).toContain(
    'linear-gradient',
  );
  await renderer.act(async () => {
    tree.update(
      <AudioFullscreenPlayerModal {...props} playbackState={State.Playing} />,
    );
  });
  expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);
  await renderer.act(async () => {
    tree.unmount();
  });
});
