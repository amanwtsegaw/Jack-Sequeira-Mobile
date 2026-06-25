import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import TrackPlayer, { State, useActiveTrack } from 'react-native-track-player';
import { type AppPalette } from '../../design';
import { type Route, type TabKey, tabItems } from '../navigation';
import { formatPlaybackTime } from '../player';
import { type AppStyles } from '../styles';

export function BackgroundGlow({ styles }: { styles: AppStyles }) {
  return (
    <>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <View style={styles.backgroundGlowThree} />
    </>
  );
}

export function BottomTabs({
  styles,
  palette,
  route,
  onSelectTab,
}: {
  styles: AppStyles;
  palette: AppPalette;
  route: Route;
  onSelectTab: (tab: TabKey) => void;
}) {
  const active: TabKey =
    route.name === 'series' || route.name === 'lesson' || route.name === 'saved'
      ? 'library'
      : route.name === 'settings'
      ? 'settings'
      : route.name;

  return (
    <View style={styles.bottomTabsShell}>
      <BlurView
        style={styles.bottomTabsBlur}
        blurAmount={28}
        reducedTransparencyFallbackColor={palette.surfaceHigh}
        blurType={palette.blurTint}
      />
      <View style={styles.bottomTabsContent}>
        {tabItems.map(item => {
          const isActive = active === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectTab(item.key)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {item.icon}
              </Text>
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function GlobalAudioMiniPlayer({
  styles,
  palette,
  track,
  playbackState,
  progress,
  onOpenAudio,
}: {
  styles: AppStyles;
  palette: AppPalette;
  track: ReturnType<typeof useActiveTrack>;
  playbackState: State | undefined;
  progress: { position: number; duration: number; buffered: number };
  onOpenAudio: () => void;
}) {
  const trackTitle =
    typeof track?.title === 'string' && track.title.length > 0
      ? track.title
      : 'Audio message';
  const trackMeta =
    typeof track?.artist === 'string' && track.artist.length > 0
      ? track.artist
      : typeof track?.album === 'string' && track.album.length > 0
      ? track.album
      : 'Jack Sequeira';
  const isPlaying = playbackState === State.Playing;
  const surfaceColors = getMiniPlayerSurfaceColors(palette);

  return (
    <View style={styles.miniPlayerShell} pointerEvents="box-none">
      <View
        style={[
          styles.miniPlayerCard,
          {
            backgroundColor: surfaceColors.background,
            borderColor: surfaceColors.border,
          },
        ]}
      >
        <Pressable onPress={onOpenAudio} style={styles.miniPlayerTextWrap}>
          <View style={styles.miniPlayerHeadingRow}>
            <Text style={styles.miniPlayerEyebrow}>
              {isPlaying ? 'Now Playing' : 'Audio Ready'}
            </Text>
            <Text style={styles.miniPlayerMeta} numberOfLines={1}>
              {formatPlaybackTime(progress.position)}
            </Text>
          </View>
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>
            {trackTitle}
          </Text>
          <Text style={styles.miniPlayerMeta} numberOfLines={1}>
            {trackMeta}
          </Text>
        </Pressable>
        <View style={styles.miniPlayerActions}>
          <Pressable
            onPress={() => TrackPlayer.seekBy(-15).catch(() => undefined)}
            style={styles.miniPlayerSeekButton}
          >
            <Text style={styles.miniPlayerActionText}>-15s</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(
                () => undefined,
              )
            }
            style={styles.miniPlayerActionButton}
          >
            <Text style={styles.miniPlayerActionText}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => TrackPlayer.seekBy(15).catch(() => undefined)}
            style={styles.miniPlayerSeekButton}
          >
            <Text style={styles.miniPlayerActionText}>+15s</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              TrackPlayer.stop()
                .then(() => TrackPlayer.seekTo(0))
                .catch(() => undefined);
            }}
            style={[
              styles.miniPlayerActionButton,
              styles.miniPlayerCloseButton,
              { backgroundColor: surfaceColors.closeBackground },
            ]}
          >
            <Text
              style={[
                styles.miniPlayerActionText,
                { color: palette.primarySolid },
              ]}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getMiniPlayerSurfaceColors(palette: AppPalette) {
  if (palette.blurTint === 'dark') {
    return {
      background: '#40352b',
      border: 'rgba(255,255,255,0.18)',
      closeBackground: '#564633',
    };
  }

  return {
    background: '#fffaf0',
    border: 'rgba(60,45,30,0.16)',
    closeBackground: '#f4e4c8',
  };
}
