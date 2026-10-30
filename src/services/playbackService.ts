import TrackPlayer, { Event, State } from 'react-native-track-player';

export function isNetworkPlaybackError(error?: {
  code?: string;
  message?: string;
}) {
  return /network|internet|offline|connection|timed?\s*out|timeout|NSURLError/i.test(
    `${error?.code ?? ''} ${error?.message ?? ''}`,
  );
}

let cancelRecovery: (() => void) | undefined;
export function pauseStreamingAudio() {
  cancelRecovery?.();
  return TrackPlayer.pause();
}

export async function playbackService() {
  let wantsPlayback = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelRetry = () => {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  };
  cancelRecovery = () => {
    wantsPlayback = false;
    cancelRetry();
  };
  const retryNetwork = () => {
    cancelRetry();
    if (!wantsPlayback) return;
    retryTimer = setTimeout(async () => {
      retryTimer = undefined;
      if (!wantsPlayback) return;
      try {
        if ((await TrackPlayer.getPlaybackState()).state !== State.Error)
          return;
        await TrackPlayer.retry();
        if (wantsPlayback) await TrackPlayer.play();
      } catch {
        retryNetwork();
      }
    }, 4000);
  };
  TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
    if (state === State.Playing) {
      wantsPlayback = true;
      cancelRetry();
    }
    if (
      [State.Paused, State.Stopped, State.Ended, State.None].includes(state)
    ) {
      wantsPlayback = false;
      cancelRetry();
    }
  });
  TrackPlayer.addEventListener(
    Event.PlaybackPlayWhenReadyChanged,
    async ({ playWhenReady }) => {
      if (playWhenReady) {
        wantsPlayback = true;
        return;
      }
      // Native network failure can clear this flag. A real pause moves to Paused.
      try {
        if ((await TrackPlayer.getPlaybackState()).state !== State.Error) {
          wantsPlayback = false;
          cancelRetry();
        }
      } catch {
        cancelRetry();
      }
    },
  );
  TrackPlayer.addEventListener(Event.PlaybackError, error => {
    if (isNetworkPlaybackError(error)) retryNetwork();
    else cancelRetry();
  });
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, cancelRetry);
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    wantsPlayback = true;
    return TrackPlayer.play();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    wantsPlayback = false;
    cancelRetry();
    return TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext(),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, event =>
    TrackPlayer.seekTo(event.position),
  );
}
