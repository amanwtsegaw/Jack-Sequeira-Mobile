import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, {State} from 'react-native-track-player';
import {SafeAreaView} from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import {type AppPalette} from '../../design';
import {type AudioTrack, type VideoItem} from '../../data/media';
import {audioPlaybackRates, formatPlaybackTime} from '../player';
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
  onOpenFullscreen,
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
  onOpenFullscreen: () => void;
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
          onOpenFullscreen={onOpenFullscreen}
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
  onOpenFullscreen,
}: {
  styles: AppStyles;
  palette: AppPalette;
  playing: boolean;
  loading?: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onOpenFullscreen: () => void;
}) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safePosition = Number.isFinite(position)
    ? Math.min(position, safeDuration || position)
    : 0;
  const rateIndex = getPlaybackRateIndex(playbackRate);

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

      <SpeedSliderControl
        styles={styles}
        palette={palette}
        playbackRate={playbackRate}
        rateIndex={rateIndex}
        onChangePlaybackRate={onChangePlaybackRate}
      />
      <Pressable onPress={onOpenFullscreen} style={styles.audioFullscreenButton}>
        <Text style={styles.audioFullscreenButtonText}>Open Fullscreen Player</Text>
      </Pressable>
    </View>
  );
}

export function AudioFullscreenPlayerModal({
  visible,
  styles,
  palette,
  track,
  playbackState,
  progress,
  playbackRate,
  onChangePlaybackRate,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  track:
    | {
        title?: string;
        artist?: string;
        album?: string;
      }
    | undefined;
  playbackState: State | undefined;
  progress: {position: number; duration: number; buffered: number};
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onClose: () => void;
}) {
  if (!track) {
    return null;
  }

  const safeDuration = Number.isFinite(progress.duration)
    ? progress.duration
    : 0;
  const safePosition = Number.isFinite(progress.position)
    ? Math.min(progress.position, safeDuration || progress.position)
    : 0;
  const title =
    typeof track.title === 'string' && track.title.length > 0
      ? track.title
      : 'Audio message';
  const meta =
    typeof track.artist === 'string' && track.artist.length > 0
      ? track.artist
      : typeof track.album === 'string' && track.album.length > 0
      ? track.album
      : 'Jack Sequeira';
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const rateIndex = getPlaybackRateIndex(playbackRate);
  const isPlaying = playbackState === State.Playing;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView
        style={styles.audioFullscreenSafeArea}
        edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView
          style={styles.audioFullscreenScroll}
          contentContainerStyle={styles.audioFullscreenScrollContent}>
          <View style={styles.audioFullscreenCard}>
          <View style={styles.audioFullscreenHeader}>
            <Text style={styles.audioFullscreenEyebrow}>Now Playing</Text>
            <Pressable onPress={onClose} style={styles.audioFullscreenCloseButton}>
              <Text style={styles.audioFullscreenCloseText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.audioArtwork}>
            <Text style={styles.audioArtworkText}>{initials || 'JS'}</Text>
          </View>

          <Text style={styles.audioFullscreenMeta} numberOfLines={1}>
            {meta}
          </Text>
          <Text style={styles.audioFullscreenTitle} numberOfLines={2}>
            {title}
          </Text>

          <Slider
            style={styles.audioFullscreenProgress}
            minimumValue={0}
            maximumValue={safeDuration || 1}
            value={safePosition}
            minimumTrackTintColor={palette.primarySolid}
            maximumTrackTintColor="rgba(255,255,255,0.22)"
            thumbTintColor={palette.primarySolid}
            onSlidingComplete={value => {
              TrackPlayer.seekTo(value).catch(() => undefined);
            }}
          />
          <View style={styles.audioFullscreenTimeRow}>
            <Text style={styles.audioFullscreenTime}>
              {formatPlaybackTime(safePosition)}
            </Text>
            <Text style={styles.audioFullscreenTime}>
              {formatPlaybackTime(safeDuration)}
            </Text>
          </View>

          <View style={styles.audioFullscreenTransportRow}>
            <TransportButton
              styles={styles}
              palette={palette}
              icon="previous"
              onPress={() => TrackPlayer.skipToPrevious().catch(() => undefined)}
            />
            <TransportButton
              styles={styles}
              palette={palette}
              icon={isPlaying ? 'pause' : 'play'}
              primary
              onPress={() =>
                (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(
                  () => undefined,
                )
              }
            />
            <TransportButton
              styles={styles}
              palette={palette}
              icon="next"
              onPress={() => TrackPlayer.skipToNext().catch(() => undefined)}
            />
          </View>

          <View style={styles.audioFullscreenSpeedCard}>
            <View style={styles.audioFullscreenSpeedTopRow}>
              <View>
                <Text style={styles.audioFullscreenEyebrow}>Playback Speed</Text>
                <Text style={styles.audioFullscreenSpeedValue}>
                  {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                </Text>
              </View>
              <View style={styles.audioFullscreenSpeedIcon}>
                <Text style={styles.audioFullscreenSpeedIconText}>◴</Text>
              </View>
            </View>
            <SpeedSliderControl
              styles={styles}
              palette={palette}
              playbackRate={playbackRate}
              rateIndex={rateIndex}
              onChangePlaybackRate={onChangePlaybackRate}
              dark
            />
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SpeedSliderControl({
  styles,
  palette,
  playbackRate,
  rateIndex,
  onChangePlaybackRate,
  dark,
}: {
  styles: AppStyles;
  palette: AppPalette;
  playbackRate: number;
  rateIndex: number;
  onChangePlaybackRate: (rate: number) => void;
  dark?: boolean;
}) {
  return (
    <View style={styles.playbackSpeedControl}>
      <View style={styles.playbackSpeedHeader}>
        <Text
          style={[
            styles.playbackSpeedText,
            dark && styles.playbackSpeedTextOnDark,
          ]}>
          Speed
        </Text>
      </View>
      <View style={styles.playbackSpeedAdjustRow}>
        <Slider
          style={styles.playbackSpeedSlider}
          minimumValue={0}
          maximumValue={audioPlaybackRates.length - 1}
          step={1}
          value={rateIndex}
          minimumTrackTintColor={palette.primarySolid}
          maximumTrackTintColor={
            dark ? 'rgba(255,255,255,0.22)' : 'rgba(80,58,34,0.16)'
          }
          thumbTintColor={palette.primarySolid}
          onSlidingComplete={value => {
            onChangePlaybackRate(getPlaybackRateByIndex(value));
          }}
        />
        <Pressable
          onPress={() => onChangePlaybackRate(getNextPlaybackRate(playbackRate))}
          style={styles.playbackSpeedCycleButton}>
          <Text style={styles.playbackSpeedCycleText}>
            {formatPlaybackRate(playbackRate)}
          </Text>
        </Pressable>
      </View>
      <View style={styles.playbackSpeedScaleRow}>
        <Text
          style={[
            styles.playbackSpeedScaleText,
            dark && styles.playbackSpeedTextOnDark,
          ]}>
          0.5x
        </Text>
        <Text
          style={[
            styles.playbackSpeedScaleText,
            dark && styles.playbackSpeedTextOnDark,
          ]}>
          1x
        </Text>
        <Text
          style={[
            styles.playbackSpeedScaleText,
            dark && styles.playbackSpeedTextOnDark,
          ]}>
          2x
        </Text>
      </View>
    </View>
  );
}

function getPlaybackRateIndex(playbackRate: number) {
  const index = audioPlaybackRates.findIndex(rate => rate === playbackRate);
  return Math.max(0, index);
}

function getPlaybackRateByIndex(index: number) {
  return audioPlaybackRates[
    Math.max(0, Math.min(audioPlaybackRates.length - 1, Math.round(index)))
  ];
}

function getNextPlaybackRate(playbackRate: number) {
  const currentIndex = getPlaybackRateIndex(playbackRate);
  return audioPlaybackRates[(currentIndex + 1) % audioPlaybackRates.length];
}

function formatPlaybackRate(playbackRate: number) {
  return playbackRate === 1 ? '1x' : `${playbackRate}x`;
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
  const {width, height} = useWindowDimensions();
  const playerWidth = Math.min(width, height * (16 / 9));
  const playerHeight = Math.round(playerWidth * (9 / 16));
  const [playerError, setPlayerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPlayerError(null);
  }, [item?.id]);

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
          <View style={styles.videoModalContent}>
            <View style={styles.videoModalIframeFrame}>
              <YoutubePlayer
                key={item.id}
                height={playerHeight}
                width={playerWidth}
                play
                videoId={item.youtubeId}
                forceAndroidAutoplay
                webViewProps={{
                  mediaPlaybackRequiresUserAction: false,
                  allowsInlineMediaPlayback: true,
                  setSupportMultipleWindows: false,
                }}
                initialPlayerParams={{
                  controls: true,
                  rel: false,
                  iv_load_policy: 3,
                }}
                onError={(error: string) => {
                  if (error === 'video_not_found') {
                    setPlayerError('This video is unavailable.');
                    return;
                  }
                  if (error === 'embed_not_allowed') {
                    setPlayerError('This video cannot be embedded.');
                    return;
                  }
                  setPlayerError('Unable to load this video. Please try another one.');
                }}
              />
            </View>
            <Text style={styles.videoModalTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {playerError ? (
              <Text style={styles.videoModalError}>{playerError}</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
