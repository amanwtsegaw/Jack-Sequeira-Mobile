import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import type { AppPalette } from '../../design';

type Props = {
  palette: AppPalette;
  variant?: 'reader' | 'cards' | 'media' | 'image';
  compact?: boolean;
  label?: string;
};
const widths: DimensionValue[] = [
  '100%',
  '94%',
  '78%',
  '100%',
  '88%',
  '65%',
  '100%',
  '91%',
  '72%',
];

// One native animation drives every placeholder; no JS work is needed per frame.
export function LoadingSkeleton({
  palette,
  variant = 'cards',
  compact = false,
  label = 'Loading content',
}: Props) {
  const sweep = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(320);
  const [imageHeight, setImageHeight] = useState(180);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (active) setReduceMotion(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1350,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      sweep.setValue(0);
    };
  }, [reduceMotion, sweep]);
  function bar(barWidth: DimensionValue, height: number, key: string) {
    return (
      <View
        key={key}
        style={[
          s.bar,
          { width: barWidth, height, backgroundColor: palette.surfaceHigh },
        ]}
      >
        {!reduceMotion ? (
          <Animated.View
            style={[
              s.sweep,
              {
                transform: [
                  {
                    translateX: sweep.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-120, width + 120],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <View
                key={i}
                style={[
                  s.strip,
                  {
                    backgroundColor: palette.foreground,
                    opacity: (1 - Math.abs(i - 4) / 5) * 0.09,
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}
      </View>
    );
  }
  return (
    <View
      testID="loading-skeleton"
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      onLayout={event => {
        setWidth(event.nativeEvent.layout.width);
        if (variant === 'image')
          setImageHeight(event.nativeEvent.layout.height);
      }}
      style={[s.root, variant === 'image' ? s.image : !compact && s.page]}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[s.content, variant === 'image' && s.image]}
      >
        {!compact && variant !== 'image' ? (
          <View style={s.heading}>
            {bar('28%', 10, 'eyebrow')}
            {bar('78%', 30, 'title')}
            {bar('92%', 14, 'subtitle')}
          </View>
        ) : null}
        {variant === 'image' ? (
          bar('100%', imageHeight, 'image')
        ) : variant === 'reader' ? (
          <View
            style={[
              s.card,
              {
                borderColor: palette.outlineVariant,
                backgroundColor: palette.surfaceLow,
              },
            ]}
          >
            {bar('68%', 23, 'reader-title')}
            <View style={s.lines}>
              {widths
                .slice(0, compact ? 5 : 9)
                .map((lineWidth, i) => bar(lineWidth, 13, `line-${i}`))}
            </View>
          </View>
        ) : (
          Array.from({ length: compact ? 2 : 4 }, (_, i) => (
            <View
              key={i}
              style={[
                s.card,
                {
                  borderColor: palette.outlineVariant,
                  backgroundColor: palette.surfaceLow,
                },
              ]}
            >
              {variant === 'media' ? bar('100%', 130, `image-${i}`) : null}
              {bar('24%', 10, `meta-${i}`)}
              {bar('80%', 23, `title-${i}`)}
              {bar('100%', 13, `body-${i}`)}
              {bar('64%', 13, `detail-${i}`)}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { width: '100%' },
  image: { height: '100%' },
  page: { padding: 24 },
  content: { gap: 18 },
  heading: { gap: 14, marginBottom: 8 },
  card: {
    padding: 20,
    gap: 13,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lines: { gap: 14, marginTop: 15 },
  bar: { overflow: 'hidden', borderRadius: 7 },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 108,
    flexDirection: 'row',
  },
  strip: { flex: 1 },
});
