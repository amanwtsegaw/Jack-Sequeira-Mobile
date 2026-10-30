import TrackPlayer, { Event, State } from 'react-native-track-player';
import {
  buildAudioQueue,
  ensureTrackPlayerSetup,
  isAudioBuffering,
} from '../src/app/player';
import {
  pauseStreamingAudio,
  isNetworkPlaybackError,
  playbackService,
} from '../src/services/playbackService';
const mockListeners = new Map<string, (payload: any) => any>();
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn((name, callback) => {
      mockListeners.set(name, callback);
      return { remove: jest.fn() };
    }),
    getPlaybackState: jest.fn(),
    retry: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
  },
  Event: {
    PlaybackState: 'state',
    PlaybackPlayWhenReadyChanged: 'intent',
    PlaybackError: 'error',
    PlaybackActiveTrackChanged: 'track',
    RemotePlay: 'play',
    RemotePause: 'pause',
    RemoteNext: 'next',
    RemotePrevious: 'previous',
    RemoteSeek: 'seek',
  },
  State: {
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
    Ended: 'ended',
    None: 'none',
    Error: 'error',
    Buffering: 'buffering',
    Loading: 'loading',
  },
  Capability: {
    Play: 1,
    Pause: 2,
    SeekTo: 3,
    SkipToNext: 4,
    SkipToPrevious: 5,
  },
  TrackType: { Default: 'default' },
}));

test('playback starts from a short buffer and queues a remote URL without downloading the file', async () => {
  await ensureTrackPlayerSetup();
  expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith(
    expect.objectContaining({ minBuffer: 3, playBuffer: 0.75, maxBuffer: 30 }),
  );
  const collection = {
    key: 'test',
    title: 'Collection',
    description: '',
    tracks: [
      {
        title: 'Track',
        reference: '',
        fileName: 'test.mp3',
        extension: 'mp3',
        sourceUrl: 'https://example.org/test.mp3',
      },
    ],
  };
  expect(buildAudioQueue(collection)[0].url).toBe(
    'https://example.org/test.mp3',
  );
  expect(
    buildAudioQueue(collection, {
      'test-test.mp3': { localPath: '/offline/test.mp3' } as any,
    })[0].url,
  ).toBe('file:///offline/test.mp3');
  expect(isAudioBuffering(State.Buffering)).toBe(true);
  expect(isAudioBuffering(State.Loading)).toBe(true);
  expect(isAudioBuffering(State.Paused)).toBe(false);
});
test('network failures retry from the current track and a user pause cancels retries', async () => {
  jest.useFakeTimers();
  await playbackService();
  mockListeners.get(Event.PlaybackState)!({ state: State.Playing });
  (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
    state: State.Error,
  });
  mockListeners.get(Event.PlaybackError)!({
    code: 'android-io-network-connection-failed',
    message: 'No internet',
  });
  await jest.advanceTimersByTimeAsync(4000);
  expect(TrackPlayer.retry).toHaveBeenCalledTimes(1);
  expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
  mockListeners.get(Event.PlaybackError)!({
    code: 'network',
    message: 'offline',
  });
  await pauseStreamingAudio();
  await jest.advanceTimersByTimeAsync(8000);
  expect(TrackPlayer.retry).toHaveBeenCalledTimes(1);
  expect(
    isNetworkPlaybackError({ code: '404', message: 'File not found' }),
  ).toBe(false);
  jest.useRealTimers();
});
