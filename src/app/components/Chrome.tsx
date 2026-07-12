import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import TrackPlayer, { State, useActiveTrack } from 'react-native-track-player';
import { type AppPalette } from '../../design';
import { type Route, type TabIcon, type TabKey, tabItems } from '../navigation';
import { audioPlaybackRates, formatPlaybackTime } from '../player';
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
  bottomOffset,
  onSelectTab,
}: {
  styles: AppStyles;
  palette: AppPalette;
  route: Route;
  bottomOffset: number;
  onSelectTab: (tab: TabKey) => void;
}) {
  const active: TabKey =
    route.name === 'series' || route.name === 'lesson' || route.name === 'saved'
      ? 'library'
      : route.name === 'settings'
      ? 'settings'
      : route.name;

  return (
    <View style={[styles.bottomTabsShell, { bottom: bottomOffset }]}>
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
              <TabIconView
                icon={item.icon}
                active={isActive}
                styles={styles}
                palette={palette}
              />
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

function TabIconView({
  icon,
  active,
  styles,
  palette,
}: {
  icon: TabIcon;
  active: boolean;
  styles: AppStyles;
  palette: AppPalette;
}) {
  const color = active ? palette.onPrimary : palette.mutedStrong;

  if (icon === 'book-open') {
    return (
      <View style={styles.tabOpenBookIcon}>
        <View
          style={[
            styles.tabOpenBookPage,
            styles.tabOpenBookLeftPage,
            { borderColor: color },
          ]}
        />
        <View
          style={[
            styles.tabOpenBookPage,
            styles.tabOpenBookRightPage,
            { borderColor: color },
          ]}
        />
      </View>
    );
  }

  if (icon === 'settings') {
    return (
      <View style={[styles.tabGearIcon, { borderColor: color }]}>
        <View style={[styles.tabGearCenter, { backgroundColor: color }]} />
      </View>
    );
  }

  const glyph = icon === 'home' ? '⌂' : icon === 'audio' ? '♪' : '▷';
  return (
    <Text style={[styles.tabIcon, { color }, active && styles.tabIconActive]}>
      {glyph}
    </Text>
  );
}

export function GlobalAudioMiniPlayer({
  styles,
  palette,
  bottomOffset,
  track,
  playbackState,
  progress,
  playbackRate,
  onChangePlaybackRate,
  onOpenAudio,
  onOpenFullscreen,
  onMinimize,
}: {
  styles: AppStyles;
  palette: AppPalette;
  bottomOffset: number;
  track: ReturnType<typeof useActiveTrack>;
  playbackState: State | undefined;
  progress: { position: number; duration: number; buffered: number };
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onOpenAudio: () => void;
  onOpenFullscreen: () => void;
  onMinimize: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const expansion = React.useRef(new Animated.Value(0)).current;
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
  const rateIndex = getPlaybackRateIndex(playbackRate);

  function openPopup() {
    setExpanded(true);
    requestAnimationFrame(() => {
      Animated.spring(expansion, {
        toValue: 1,
        tension: 95,
        friction: 13,
        useNativeDriver: true,
      }).start();
    });
  }

  function closePopup() {
    Animated.timing(expansion, {
      toValue: 0,
      duration: 170,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setExpanded(false);
      }
    });
  }

  if (!expanded) {
    return (
      <View
        style={[styles.miniPlayerFabShell, { bottom: bottomOffset + 98 }]}
        pointerEvents="box-none"
      >
        <Pressable onPress={openPopup} style={styles.miniPlayerFab}>
          <Text style={styles.miniPlayerFabText}>{isPlaying ? 'Ⅱ' : '♪'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.miniPlayerShell,
        {
          bottom: bottomOffset + 106,
          opacity: expansion,
          transform: [
            {
              translateX: expansion.interpolate({
                inputRange: [0, 1],
                outputRange: [-84, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
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
        <View style={styles.miniPlayerSpeedControl}>
          <View style={styles.miniPlayerSpeedHeader}>
            <Text style={styles.miniPlayerSpeedText}>Speed</Text>
          </View>
          <View style={styles.miniPlayerSpeedAdjustRow}>
            <Slider
              style={styles.miniPlayerSpeedSlider}
              minimumValue={0}
              maximumValue={audioPlaybackRates.length - 1}
              step={1}
              value={rateIndex}
              minimumTrackTintColor={palette.primarySolid}
              maximumTrackTintColor={palette.outline}
              thumbTintColor={palette.primarySolid}
              onSlidingComplete={value => {
                onChangePlaybackRate(getPlaybackRateByIndex(value));
              }}
            />
            <Pressable
              onPress={() => onChangePlaybackRate(getNextPlaybackRate(playbackRate))}
              style={styles.miniPlayerSpeedCycleButton}
            >
              <Text style={styles.miniPlayerSpeedCycleText}>
                {formatPlaybackRate(playbackRate)}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.miniPlayerActions}>
          <Pressable
            onPress={() => TrackPlayer.seekBy(-15).catch(() => undefined)}
            style={styles.miniPlayerSeekButton}
          >
            <Text style={styles.miniPlayerActionText}>↺</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(
                () => undefined,
              )
            }
            style={[styles.miniPlayerActionButton, styles.miniPlayerRoundButton]}
          >
            <Text style={styles.miniPlayerActionText}>
              {isPlaying ? 'Ⅱ' : '▶'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => TrackPlayer.seekBy(15).catch(() => undefined)}
            style={styles.miniPlayerSeekButton}
          >
            <Text style={styles.miniPlayerActionText}>↻</Text>
          </Pressable>
          <Pressable
            onPress={onOpenAudio}
            style={styles.miniPlayerActionButton}
          >
            <Text style={styles.miniPlayerActionText}>Audio</Text>
          </Pressable>
          <Pressable
            onPress={onOpenFullscreen}
            style={styles.miniPlayerActionButton}
          >
            <Text style={styles.miniPlayerActionText}>Player</Text>
          </Pressable>
          <Pressable
            onPress={onMinimize}
            style={styles.miniPlayerActionButton}
          >
            <Text style={styles.miniPlayerActionText}>Hide</Text>
          </Pressable>
          <Pressable onPress={closePopup} style={styles.miniPlayerActionButton}>
            <Text style={styles.miniPlayerActionText}>Minimize</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function getMiniPlayerSurfaceColors(palette: AppPalette) {
  if (palette.blurTint === 'dark') {
    return {
      background: '#40352b',
      border: 'rgba(255,255,255,0.18)',
    };
  }

  return {
    background: '#fffaf0',
    border: 'rgba(60,45,30,0.16)',
  };
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
