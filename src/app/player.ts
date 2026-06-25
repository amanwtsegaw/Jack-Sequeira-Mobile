import TrackPlayer, {Capability, TrackType} from 'react-native-track-player';
import {type AudioCollection} from '../data/media';

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

export function getYoutubeWatchUrl(youtubeId: string) {
  return `https://m.youtube.com/watch?v=${youtubeId}&autoplay=1&noapp=1`;
}

export function shouldStayInWebView(url: string) {
  if (url.startsWith('youtube:') || url.startsWith('vnd.youtube:')) {
    return false;
  }
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }
  return true;
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
