import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { type AppPalette } from '../../design';
import { type AppStyles } from '../styles';

export function StepSliderControl({
  styles,
  palette,
  label,
  valueLabel,
  valueIndex,
  maximum,
  onDecrease,
  onIncrease,
  onChange,
}: {
  styles: AppStyles;
  palette: AppPalette;
  label?: string;
  valueLabel: string;
  valueIndex: number;
  maximum: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.sliderSection}>
      {label ? (
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderValue}>{valueLabel}</Text>
        </View>
      ) : null}
      <View style={styles.sliderRow}>
        <Pressable onPress={onDecrease} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maximum}
          step={1}
          minimumTrackTintColor={palette.primarySolid}
          maximumTrackTintColor={palette.outline}
          thumbTintColor={palette.primarySolid}
          value={valueIndex}
          onValueChange={value => onChange(Math.round(value))}
        />
        <Pressable onPress={onIncrease} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function GlassHeader({
  styles,
  title,
  leftAction,
  actions = [],
}: {
  styles: AppStyles;
  title?: string;
  subtitle?: string;
  leftAction?: { icon: string; label: string; onPress: () => void };
  actions?: Array<{
    icon: string;
    label: string;
    onPress: () => void;
    active?: boolean;
  }>;
}) {
  return (
    <View style={styles.headerFrame}>
      <View style={styles.headerShell}>
        {leftAction ? (
          <View style={styles.headerSide}>
            <HeaderIconButton styles={styles} {...leftAction} />
          </View>
        ) : null}
        <View style={styles.headerTextWrap}>
          {title ? (
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {title}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerActionRow}>
          {actions.map(action => (
            <HeaderIconButton
              key={`${action.label}-${action.icon}`}
              styles={styles}
              {...action}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function HeaderIconButton({
  styles,
  icon,
  label,
  onPress,
  active,
}: {
  styles: AppStyles;
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.headerIconButton, active && styles.headerIconButtonActive]}
    >
      <Text
        style={[styles.headerIconGlyph, active && styles.headerIconGlyphActive]}
      >
        {icon}
      </Text>
    </Pressable>
  );
}

export function GlassCard({
  styles,
  children,
}: {
  styles: AppStyles;
  children: React.ReactNode;
}) {
  return <View style={styles.glassCard}>{children}</View>;
}

export function GlassSearchBar({
  styles,
  palette,
  value,
  onChangeText,
  placeholder,
}: {
  styles: AppStyles;
  palette: AppPalette;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={styles.searchInput}
      />
    </View>
  );
}

export function SectionHeader({
  styles,
  title,
  subtitle,
}: {
  styles: AppStyles;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text
        style={styles.sectionTitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {title}
      </Text>
      <Text style={styles.bodyMuted}>{subtitle}</Text>
    </View>
  );
}

export function LessonRowCard({
  styles,
  title,
  meta,
  description,
  accent,
  onPress,
}: {
  styles: AppStyles;
  title: string;
  meta: string;
  description: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.listCard}>
      <View style={styles.listCardIcon}>
        <Text
          style={styles.listCardIconText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {accent}
        </Text>
      </View>
      <View style={styles.listCardBody}>
        <Text style={styles.cardMeta}>{meta}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.bodyMuted} numberOfLines={3}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export function SeriesRowCard({
  styles,
  title,
  description,
  meta,
  onPress,
}: {
  styles: AppStyles;
  title: string;
  description: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.seriesCard}>
      <Text style={styles.cardMeta}>{meta}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.bodyMuted}>{description}</Text>
    </Pressable>
  );
}

export function SegmentButton({
  styles,
  label,
  active,
  onPress,
}: {
  styles: AppStyles;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text
        style={[
          styles.segmentButtonText,
          active && styles.segmentButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function InfoChip({
  styles,
  label,
}: {
  styles: AppStyles;
  label: string;
}) {
  return (
    <View style={styles.infoChip}>
      <View style={styles.infoChipDot} />
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

export function GlassStat({
  styles,
  label,
  value,
}: {
  styles: AppStyles;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function PillButton({
  styles,
  label,
  onPress,
}: {
  styles: AppStyles;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  styles,
  palette,
  label,
  loading,
  onPress,
}: {
  styles: AppStyles;
  palette: AppPalette;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={styles.secondaryButton}
    >
      <View style={styles.secondaryButtonContent}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={palette.primarySolid}
            style={styles.secondaryButtonSpinner}
          />
        ) : null}
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </View>
    </Pressable>
  );
}
