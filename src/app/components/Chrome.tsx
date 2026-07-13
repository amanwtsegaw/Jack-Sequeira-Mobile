import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import TrackPlayer, { State, useActiveTrack } from 'react-native-track-player';
import { type AppPalette } from '../../design';
import { type Route, type TabIcon, type TabKey, tabItems } from '../navigation';
import { audioPlaybackRates, formatPlaybackTime } from '../player';
import { type AppStyles } from '../styles';

const activeTabIndicatorSize = 62;

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

  const activeIndex = Math.max(
    0,
    tabItems.findIndex(item => item.key === active),
  );
  const tabLayouts = useRef<Array<{ x: number; width: number }>>(
    Array.from({ length: tabItems.length }, () => ({ x: 0, width: 0 })),
  );
  const layoutsReady = useRef(false);
  const previousIndex = useRef(activeIndex);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const indicatorGlow = useRef(new Animated.Value(0.45)).current;
  const [, setLayoutVersion] = useState(0);

  const moveIndicator = useCallback((
    index: number,
    options?: { animate?: boolean; fromIndex?: number },
  ) => {
    const layout = tabLayouts.current[index];
    if (!layout || layout.width <= 0) {
      return;
    }

    const animate = options?.animate ?? true;
    const fromIndex = options?.fromIndex ?? previousIndex.current;
    const fromLayout = tabLayouts.current[fromIndex] ?? layout;
    const indicatorSize = Math.min(activeTabIndicatorSize, layout.width);
    const fromIndicatorSize = Math.min(activeTabIndicatorSize, fromLayout.width);
    const targetX = layout.x + (layout.width - indicatorSize) / 2;
    const fromX = fromLayout.x + (fromLayout.width - fromIndicatorSize) / 2;
    const travelingRight = targetX >= fromX;
    const travelDistance = Math.abs(targetX - fromX);
    const swooshWidth = indicatorSize + travelDistance * 0.4;
    const swooshX = travelingRight ? fromX : targetX;

    if (!animate) {
      indicatorX.setValue(targetX);
      indicatorWidth.setValue(indicatorSize);
      indicatorScale.setValue(1);
      indicatorGlow.setValue(0.45);
      previousIndex.current = index;
      return;
    }

    indicatorX.stopAnimation();
    indicatorWidth.stopAnimation();
    indicatorScale.stopAnimation();
    indicatorGlow.stopAnimation();

    Animated.parallel([
      Animated.sequence([
        Animated.parallel([
          Animated.timing(indicatorX, {
            toValue: swooshX,
            duration: 110,
            useNativeDriver: false,
          }),
          Animated.timing(indicatorWidth, {
            toValue: swooshWidth,
            duration: 110,
            useNativeDriver: false,
          }),
          Animated.timing(indicatorGlow, {
            toValue: 0.85,
            duration: 110,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
            Animated.spring(indicatorX, {
              toValue: targetX,
            useNativeDriver: false,
            tension: 118,
            friction: 11,
            velocity: travelingRight ? 2.4 : -2.4,
          }),
            Animated.spring(indicatorWidth, {
              toValue: indicatorSize,
            useNativeDriver: false,
            tension: 108,
            friction: 10,
          }),
          Animated.spring(indicatorGlow, {
            toValue: 0.45,
            useNativeDriver: true,
            tension: 90,
            friction: 12,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.spring(indicatorScale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 240,
          friction: 7,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 140,
          friction: 9,
        }),
      ]),
    ]).start();

    previousIndex.current = index;
  }, [indicatorGlow, indicatorScale, indicatorWidth, indicatorX]);

  useEffect(() => {
    if (layoutsReady.current) {
      moveIndicator(activeIndex, {
        animate: previousIndex.current !== activeIndex,
      });
    }
  }, [activeIndex, moveIndicator]);

  function handleTabLayout(index: number, event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    const measuredCount = tabLayouts.current.filter(
      item => item.width > 0,
    ).length;

    if (measuredCount === tabItems.length && !layoutsReady.current) {
      layoutsReady.current = true;
      moveIndicator(activeIndex, { animate: false });
      setLayoutVersion(version => version + 1);
    }
  }

  return (
    <View style={[styles.bottomTabsShell, { bottom: bottomOffset }]}>
      <BlurView
        style={styles.bottomTabsBlur}
        blurAmount={28}
        reducedTransparencyFallbackColor={palette.surfaceHigh}
        blurType={palette.blurTint}
      />
      <View style={styles.bottomTabsContent}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabActiveIndicatorShell,
            {
              width: indicatorWidth,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.tabActiveIndicator,
              {
                opacity: indicatorGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
                transform: [{ scaleY: indicatorScale }],
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabActiveIndicatorShell,
            styles.tabActiveIndicatorTrailShell,
            {
              width: indicatorWidth,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.tabActiveIndicatorTrail,
              {
                opacity: indicatorGlow,
                transform: [{ scaleY: 0.88 }],
              },
            ]}
          />
        </Animated.View>
        {tabItems.map((item, index) => {
          const isActive = active === item.key;
          return (
            <AnimatedTabButton
              key={item.key}
              styles={styles}
              palette={palette}
              item={item}
              isActive={isActive}
              onLayout={event => handleTabLayout(index, event)}
              onPress={() => onSelectTab(item.key)}
            />
          );
        })}
      </View>
    </View>
  );
}

function AnimatedTabButton({
  styles,
  palette,
  item,
  isActive,
  onLayout,
  onPress,
}: {
  styles: AppStyles;
  palette: AppPalette;
  item: (typeof tabItems)[number];
  isActive: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: () => void;
}) {
  const bounce = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const wasActive = useRef(isActive);

  useEffect(() => {
    if (isActive && !wasActive.current) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(bounce, {
            toValue: 1.24,
            useNativeDriver: true,
            tension: 260,
            friction: 6,
          }),
          Animated.spring(bounce, {
            toValue: 1,
            useNativeDriver: true,
            tension: 170,
            friction: 8,
          }),
        ]),
        Animated.sequence([
          Animated.spring(lift, {
            toValue: -4,
            useNativeDriver: true,
            tension: 220,
            friction: 7,
          }),
          Animated.spring(lift, {
            toValue: 0,
            useNativeDriver: true,
            tension: 140,
            friction: 9,
          }),
        ]),
      ]).start();
    }

    wasActive.current = isActive;
  }, [isActive, bounce, lift]);

  function handlePress() {
    if (!isActive) {
      Animated.sequence([
        Animated.spring(bounce, {
          toValue: 0.84,
          useNativeDriver: true,
          tension: 320,
          friction: 8,
        }),
        Animated.parallel([
          Animated.spring(bounce, {
            toValue: 1.18,
            useNativeDriver: true,
            tension: 240,
            friction: 6,
          }),
          Animated.spring(lift, {
            toValue: -3,
            useNativeDriver: true,
            tension: 220,
            friction: 7,
          }),
        ]),
        Animated.parallel([
          Animated.spring(bounce, {
            toValue: 1,
            useNativeDriver: true,
            tension: 160,
            friction: 8,
          }),
          Animated.spring(lift, {
            toValue: 0,
            useNativeDriver: true,
            tension: 130,
            friction: 9,
          }),
        ]),
      ]).start();
    }

    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabButtonContent,
          { transform: [{ scale: bounce }, { translateY: lift }] },
        ]}
      >
        <TabIconView
          icon={item.icon}
          active={isActive}
          styles={styles}
          palette={palette}
        />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
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

  return (
    <View style={styles.tabIconFrame}>
      {icon === 'home' ? (
        <TabHomeIcon color={color} styles={styles} />
      ) : icon === 'book-open' ? (
        <TabBookOpenIcon color={color} styles={styles} />
      ) : icon === 'audio' ? (
        <TabAudioIcon color={color} styles={styles} />
      ) : icon === 'video' ? (
        <TabVideoIcon color={color} styles={styles} />
      ) : (
        <TabGearIcon color={color} styles={styles} />
      )}
    </View>
  );
}

function TabHomeIcon({
  color,
  styles,
}: {
  color: string;
  styles: AppStyles;
}) {
  return (
    <View style={styles.tabHomeIcon}>
      <View
        style={[styles.tabHomeRoof, { borderBottomColor: color }]}
      />
      <View style={[styles.tabHomeBody, { backgroundColor: color }]} />
    </View>
  );
}

function TabBookOpenIcon({
  color,
  styles,
}: {
  color: string;
  styles: AppStyles;
}) {
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

function TabAudioIcon({
  color,
  styles,
}: {
  color: string;
  styles: AppStyles;
}) {
  return (
    <View style={styles.tabAudioIcon}>
      <View style={[styles.tabAudioHeadband, { borderColor: color }]} />
      <View style={styles.tabAudioCupsRow}>
        <View style={[styles.tabAudioEarCup, { backgroundColor: color }]} />
        <View style={[styles.tabAudioEarCup, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function TabVideoIcon({
  color,
  styles,
}: {
  color: string;
  styles: AppStyles;
}) {
  return (
    <View style={[styles.tabVideoIcon, { borderColor: color }]}>
      <View
        style={[styles.tabVideoPlayTriangle, { borderLeftColor: color }]}
      />
    </View>
  );
}

function TabGearIcon({
  color,
  styles,
}: {
  color: string;
  styles: AppStyles;
}) {
  return (
    <View style={styles.tabGearIcon}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <View
          key={angle}
          style={[
            styles.tabGearTooth,
            {
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }, { translateY: -9 }],
            },
          ]}
        />
      ))}
      <View style={[styles.tabGearRing, { borderColor: color }]} />
    </View>
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
