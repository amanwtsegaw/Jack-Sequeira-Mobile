import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, {State} from 'react-native-track-player';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {type AppPalette} from '../../design';
import {type AudioTrack, type VideoItem} from '../../data/media';
import {
  formatPlaybackTime,
  getYoutubeWatchUrl,
  shouldStayInWebView,
} from '../player';
import {type AppStyles} from '../styles';
import {GhostButton, InfoChip} from './Shared';

export function AudioTrackCard({
  styles,
  palette,
  collectionKey,
  track,
  activeTrackId,
  playbackState,
  progress,
  loading,
  playbackRate,
  onChangePlaybackRate,
  onPlay,
}: {
  styles: AppStyles;
  palette: AppPalette;
  collectionKey: string;
  track: AudioTrack;
  activeTrackId: string | null;
  playbackState: State | undefined;
  progress: {position: number; duration: number; buffered: number};
  loading: boolean;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onPlay: () => void;
}) {
  const trackId = `${collectionKey}-${track.fileName}`;
  const isActive = activeTrackId === trackId;
  const isPlaying = isActive && playbackState === State.Playing;

  return (
    <View style={styles.audioTrackCard}>
      <View style={styles.audioTrackTopRow}>
        <View style={styles.audioTrackReferenceBadge}>
          <Text style={styles.audioTrackReferenceText}>{track.reference}</Text>
        </View>
        <Text style={styles.audioTrackExtension}>{track.extension.toUpperCase()}</Text>
      </View>
      <Text style={styles.cardTitle}>{track.title}</Text>
      <Text style={styles.audioTrackFileName}>{track.fileName}</Text>
      {isActive ? (
        <AudioTransportCard
          styles={styles}
          palette={palette}
          playing={isPlaying}
          loading={loading}
          position={progress.position}
          duration={progress.duration}
          playbackRate={playbackRate}
          onChangePlaybackRate={onChangePlaybackRate}
        />
      ) : null}
      <View style={styles.heroButtonRow}>
        <GhostButton
          styles={styles}
          palette={palette}
          label={loading ? 'Loading…' : isPlaying ? 'Pause audio' : 'Play audio'}
          loading={loading}
          onPress={onPlay}
        />
      </View>
    </View>
  );
}

export function VideoCard({
  styles,
  palette,
  item,
  onPlay,
}: {
  styles: AppStyles;
  palette: AppPalette;
  item: VideoItem;
  onPlay: () => void;
}) {
  return (
    <View style={styles.videoCard}>
      <Pressable onPress={onPlay} style={styles.videoThumbnailWrap}>
        <Image source={{uri: item.thumbnailUrl}} style={styles.videoThumbnail} />
        <View style={styles.videoThumbnailOverlay}>
          <View style={styles.videoPlayButton}>
            <Text style={styles.videoPlayButtonText}>Play Fullscreen</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.videoCardBody}>
        <View style={styles.videoMetaRow}>
          <InfoChip styles={styles} label={item.duration} />
          {item.reference ? <InfoChip styles={styles} label={item.reference} /> : null}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.heroButtonRow}>
          <GhostButton
            styles={styles}
            palette={palette}
            label="Watch video"
            onPress={onPlay}
          />
        </View>
      </View>
    </View>
  );
}

function AudioTransportCard({
  styles,
  palette,
  playing,
  loading,
  position,
  duration,
  playbackRate,
  onChangePlaybackRate,
}: {
  styles: AppStyles;
  palette: AppPalette;
  playing: boolean;
  loading?: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
}) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safePosition = Number.isFinite(position)
    ? Math.min(position, safeDuration || position)
    : 0;

  return (
    <View style={styles.audioTransportCard}>
      <View style={styles.audioTransportTopRow}>
        <Text style={styles.audioTransportState}>
          {playing ? 'Now Playing' : 'Ready to Resume'}
        </Text>
        <Text style={styles.audioTransportTime}>
          {formatPlaybackTime(safePosition)} / {formatPlaybackTime(safeDuration)}
        </Text>
      </View>

      <Slider
        style={styles.audioTransportSlider}
        minimumValue={0}
        maximumValue={safeDuration || 1}
        value={safePosition}
        minimumTrackTintColor={palette.primarySolid}
        maximumTrackTintColor="rgba(255,255,255,0.18)"
        thumbTintColor={palette.primarySolid}
        onSlidingComplete={value => {
          TrackPlayer.seekTo(value).catch(() => undefined);
        }}
      />

      <View style={styles.audioTransportControls}>
        <TransportButton
          styles={styles}
          palette={palette}
          icon="rewind15"
          onPress={() => TrackPlayer.seekBy(-15).catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="previous"
          onPress={() => TrackPlayer.skipToPrevious().catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon={playing ? 'pause' : 'play'}
          primary
          loading={loading}
          onPress={() =>
            (playing ? TrackPlayer.pause() : TrackPlayer.play()).catch(() => undefined)
          }
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="next"
          onPress={() => TrackPlayer.skipToNext().catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="forward15"
          onPress={() => TrackPlayer.seekBy(15).catch(() => undefined)}
        />
      </View>

      <View style={styles.playbackSpeedRow}>
        {[1, 1.5, 2].map(rate => (
          <Pressable
            key={rate}
            onPress={() => onChangePlaybackRate(rate)}
            style={[
              styles.playbackSpeedButton,
              playbackRate === rate && styles.playbackSpeedButtonActive,
            ]}
          >
            <Text
              style={[
                styles.playbackSpeedText,
                playbackRate === rate && styles.playbackSpeedTextActive,
              ]}
            >
              {rate === 1 ? 'Default' : `${rate}x`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TransportButton({
  styles,
  palette,
  icon,
  primary,
  loading,
  onPress,
}: {
  styles: AppStyles;
  palette: AppPalette;
  icon: 'rewind15' | 'previous' | 'play' | 'pause' | 'next' | 'forward15';
  primary?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.transportButton, primary && styles.transportButtonPrimary]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={primary ? palette.onPrimary : palette.primarySolid}
        />
      ) : (
        <TransportIcon styles={styles} icon={icon} primary={primary} />
      )}
    </Pressable>
  );
}

function TransportIcon({
  styles,
  icon,
  primary,
}: {
  styles: AppStyles;
  icon: 'rewind15' | 'previous' | 'play' | 'pause' | 'next' | 'forward15';
  primary?: boolean;
}) {
  if (icon === 'play') {
    return (
      <View style={styles.transportIconWrap}>
        <View
          style={[
            styles.transportPlayTriangle,
            primary && styles.transportPlayTrianglePrimary,
          ]}
        />
      </View>
    );
  }

  if (icon === 'pause') {
    return (
      <View style={styles.transportIconWrap}>
        <View style={styles.transportPauseWrap}>
          <View
            style={[
              styles.transportPauseBar,
              primary && styles.transportPauseBarPrimary,
            ]}
          />
          <View
            style={[
              styles.transportPauseBar,
              primary && styles.transportPauseBarPrimary,
            ]}
          />
        </View>
      </View>
    );
  }

  if (icon === 'previous' || icon === 'next') {
    const reverse = icon === 'previous';
    return (
      <View
        style={[
          styles.transportIconWrap,
          reverse && styles.transportIconWrapReverse,
        ]}>
        <View style={styles.transportSkipBar} />
        <View
          style={[
            styles.transportSkipTriangle,
            primary && styles.transportSkipTrianglePrimary,
          ]}
        />
        <View
          style={[
            styles.transportSkipTriangle,
            styles.transportSkipTriangleTight,
            primary && styles.transportSkipTrianglePrimary,
          ]}
        />
      </View>
    );
  }

  const rewind = icon === 'rewind15';
  return (
    <View style={styles.transportSeekWrap}>
      <Text
        style={[
          styles.transportSeekGlyph,
          primary && styles.transportButtonTextPrimary,
        ]}>
        {rewind ? '↺' : '↻'}
      </Text>
      <Text
        style={[
          styles.transportSeekValue,
          primary && styles.transportButtonTextPrimary,
        ]}>
        15
      </Text>
    </View>
  );
}

export function VideoPlayerModal({
  styles,
  item,
  onClose,
}: {
  styles: AppStyles;
  item: VideoItem | null;
  onClose: () => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView
        style={styles.videoModalSafeArea}
        edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.videoModalPlayerWrap}>
          <Pressable onPress={onClose} style={styles.videoModalCloseButtonFloating}>
            <Text style={styles.videoModalCloseText}>Close</Text>
          </Pressable>
          <WebView
            style={styles.videoModalPlayer}
            source={{uri: getYoutubeWatchUrl(item.youtubeId)}}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            originWhitelist={['https://*', 'http://*']}
            onShouldStartLoadWithRequest={request => shouldStayInWebView(request.url)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
