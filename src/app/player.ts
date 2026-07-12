import TrackPlayer, {Capability, TrackType} from 'react-native-track-player';
import {type AudioCollection} from '../data/media';

export const audioPlaybackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

let trackPlayerSetupPromise: Promise<void> | null = null;

export async function ensureTrackPlayerSetup() {
  if (!trackPlayerSetupPromise) {
    trackPlayerSetupPromise = (async () => {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        progressUpdateEventInterval: 0.25,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });
    })().catch(error => {
      trackPlayerSetupPromise = null;
      throw error;
    });
  }

  return trackPlayerSetupPromise;
}

export function buildAudioQueue(collection: AudioCollection) {
  return collection.tracks.map(track => ({
    id: `${collection.key}-${track.fileName}`,
    title: track.title,
    artist: track.reference,
    album: collection.title,
    url: getAudioPlaybackUrl(track.fileName),
    type: TrackType.Default,
    contentType: getAudioContentType(track.extension),
  }));
}

export function formatPlaybackTime(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getAudioPlaybackUrl(fileName: string) {
  return `https://jacksequeira.org/audio/${encodeURIComponent(fileName)}`;
}

function getAudioContentType(extension: string) {
  switch (extension.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wma':
      return 'audio/x-ms-wma';
    case 'm4a':
      return 'audio/mp4';
    case 'wav':
      return 'audio/wav';
    default:
      return 'audio/mpeg';
  }
}
