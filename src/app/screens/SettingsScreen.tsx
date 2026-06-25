import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  fontChoices,
  fontScaleOptions,
  getValueIndex,
  lineHeightOptions,
  themeChoices,
  type AppPalette,
  type FontChoice,
} from '../../design';
import { type ReaderSettings } from '../../storage';
import { labelForLineHeight, labelForScale } from '../utils';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  SectionHeader,
  SegmentButton,
  StepSliderControl,
} from '../components/Shared';

export function SettingsScreen({
  styles,
  settings,
  palette,
  onBack,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onBumpFontScale,
  onBumpLineHeight,
  onUpdateFontScaleByIndex,
  onUpdateLineHeightByIndex,
  onOpenSaved,
  savedSummary,
}: {
  styles: AppStyles;
  settings: ReaderSettings;
  palette: AppPalette;
  onBack: () => void;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onBumpFontScale: (direction: -1 | 1) => void;
  onBumpLineHeight: (direction: -1 | 1) => void;
  onUpdateFontScaleByIndex: (index: number) => void;
  onUpdateLineHeightByIndex: (index: number) => void;
  onOpenSaved: () => void;
  savedSummary: {
    favorites: number;
    highlights: number;
    notes: number;
  };
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassHeader
        styles={styles}
        title="Settings"
        leftAction={{ icon: '‹', label: 'Back', onPress: onBack }}
      />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Theme"
          subtitle="Choose the app mood."
        />
        <View style={styles.segmentedRow}>
          {themeChoices.map(choice => (
            <SegmentButton
              key={choice.id}
              styles={styles}
              label={choice.label}
              active={settings.themeMode === choice.id}
              onPress={() => onUpdateThemeMode(choice.id)}
            />
          ))}
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Text Size"
          subtitle="Use the slider or step buttons."
        />
        <StepSliderControl
          styles={styles}
          palette={palette}
          valueLabel={labelForScale(settings.fontScale)}
          valueIndex={getValueIndex(fontScaleOptions, settings.fontScale)}
          maximum={fontScaleOptions.length - 1}
          onDecrease={() => onBumpFontScale(-1)}
          onIncrease={() => onBumpFontScale(1)}
          onChange={onUpdateFontScaleByIndex}
        />
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Line Height"
          subtitle="Control reading rhythm."
        />
        <StepSliderControl
          styles={styles}
          palette={palette}
          valueLabel={labelForLineHeight(settings.lineHeight)}
          valueIndex={getValueIndex(lineHeightOptions, settings.lineHeight)}
          maximum={lineHeightOptions.length - 1}
          onDecrease={() => onBumpLineHeight(-1)}
          onIncrease={() => onBumpLineHeight(1)}
          onChange={onUpdateLineHeightByIndex}
        />
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Reading Font"
          subtitle="Applied across reader and interface text."
        />
        <View style={styles.fontChoiceGrid}>
          {fontChoices.map(choice => (
            <Pressable
              key={choice.id}
              onPress={() => onUpdateFontChoice(choice.id)}
              style={[
                styles.fontChoiceCard,
                settings.fontChoice === choice.id &&
                  styles.fontChoiceCardActive,
              ]}
            >
              <Text style={styles.fontChoiceSample}>Aa</Text>
              <Text style={styles.fontChoiceLabel}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Preview"
          subtitle="Current app-wide typography preview."
        />
        <Text style={styles.settingsPreviewHeading}>
          Grace, rhythm, and readability
        </Text>
        <Text
          style={[
            styles.settingsPreview,
            {
              fontSize: 18 * settings.fontScale,
              lineHeight: 18 * settings.fontScale * settings.lineHeight,
            },
          ]}
        >
          The selected font now applies throughout the app. Text size, line
          height, and theme stay in sync between the settings screen and the
          reader controls sheet.
        </Text>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Saved"
          subtitle="Quick access to bookmarks, highlights, and notes."
        />
        <View style={styles.metaRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              {savedSummary.favorites} lessons
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              {savedSummary.highlights} highlights
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>{savedSummary.notes} notes</Text>
          </View>
        </View>
        <Pressable onPress={onOpenSaved} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open Saved</Text>
        </Pressable>
      </GlassCard>
    </ScrollView>
  );
}
