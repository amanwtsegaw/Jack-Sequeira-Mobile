import {NativeModules} from 'react-native';
import {type AudioTrack} from '../data/media';
import {getAudioPlaybackUrl} from '../app/player';
import {type DownloadedAudioItem} from '../storage';

type RNFSModule = {
  DocumentDirectoryPath: string;
  mkdir: (filepath: string) => Promise<void>;
  exists: (filepath: string) => Promise<boolean>;
  unlink: (filepath: string) => Promise<void>;
  moveFile: (filepath: string, destPath: string) => Promise<void>;
  stat: (filepath: string) => Promise<{size: number | string}>;
  downloadFile: (options: {
    fromUrl: string;
    toFile: string;
    headers?: Record<string, string>;
    progressDivider?: number;
    progress?: (event: {
      bytesWritten: number;
      contentLength: number;
    }) => void;
  }) => {
    promise: Promise<{statusCode: number}>;
  };
};

export function getAudioTrackId(collectionKey: string, fileName: string) {
  return `${collectionKey}-${fileName}`;
}

export async function downloadAudioTrack({
  collectionKey,
  track,
  onProgress,
}: {
  collectionKey: string;
  track: AudioTrack;
  onProgress: (progress: number) => void;
}): Promise<DownloadedAudioItem> {
  const RNFS = getRNFS();
  const audioDirectory = `${RNFS.DocumentDirectoryPath}/audio-downloads`;

  await RNFS.mkdir(audioDirectory);

  const id = getAudioTrackId(collectionKey, track.fileName);
  const safeFileName = track.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const localPath = `${audioDirectory}/${collectionKey}-${safeFileName}`;
  const tempPath = `${localPath}.download`;

  if (await RNFS.exists(tempPath)) {
    await RNFS.unlink(tempPath);
  }

  const result = RNFS.downloadFile({
    fromUrl: getAudioPlaybackUrl(track.fileName),
    toFile: tempPath,
    headers: {
      Accept: getAudioAcceptHeader(track.extension),
      'User-Agent': 'JackSequeiraMobile/1.0',
    },
    progressDivider: 1,
    progress: event => {
      if (event.contentLength > 0) {
        onProgress(event.bytesWritten / event.contentLength);
      }
    },
  });

  const response = await result.promise;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    if (await RNFS.exists(tempPath)) {
      await RNFS.unlink(tempPath);
    }
    throw new Error(`Download failed with status ${response.statusCode}`);
  }

  if (await RNFS.exists(localPath)) {
    await RNFS.unlink(localPath);
  }
  await RNFS.moveFile(tempPath, localPath);
  const stat = await RNFS.stat(localPath);

  return {
    id,
    collectionKey,
    fileName: track.fileName,
    title: track.title,
    reference: track.reference,
    localPath,
    bytes: Number(stat.size) || 0,
    downloadedAt: new Date().toISOString(),
  };
}

export async function deleteDownloadedAudio(localPath: string) {
  const RNFS = getRNFS();
  if (await RNFS.exists(localPath)) {
    await RNFS.unlink(localPath);
  }
}

function getRNFS(): RNFSModule {
  if (!NativeModules.RNFSManager) {
    throw new Error(
      'react-native-fs native module is not available in this build.',
    );
  }

  // Loading react-native-fs at module scope crashes if its native module is not linked.
  const imported = require('react-native-fs') as RNFSModule & {
    default?: RNFSModule;
  };
  return imported.default ?? imported;
}

function getAudioAcceptHeader(extension: string) {
  switch (extension.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg,*/*;q=0.8';
    case 'wma':
      return 'audio/x-ms-wma,*/*;q=0.8';
    case 'm4a':
      return 'audio/mp4,*/*;q=0.8';
    case 'wav':
      return 'audio/wav,*/*;q=0.8';
    default:
      return 'audio/*,*/*;q=0.8';
  }
}
