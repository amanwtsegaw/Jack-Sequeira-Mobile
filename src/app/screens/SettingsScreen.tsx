import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  fontChoices,
  fontScaleOptions,
  getValueIndex,
  getReadingLanguageLabel,
  getReadingLanguageNativeLabel,
  getReadingPreviewText,
  lineHeightOptions,
  readingLanguageChoices,
  resolveFontFamily,
  themeChoices,
  type AppPalette,
  type FontChoice,
} from '../../design';
import { type ArchiveLesson } from '../../data/archive';
import { type Route } from '../navigation';
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
  previewLesson,
  previewRoute,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onUpdateReadingLanguage,
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
  previewLesson: ArchiveLesson | null;
  previewRoute: Route | null;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onUpdateReadingLanguage: (
    readingLanguage: ReaderSettings['readingLanguage'],
  ) => void;
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
  const previewHeading =
    previewLesson?.title ?? `${getReadingLanguageLabel(settings.readingLanguage)} Reader`;
  const previewBody =
    previewLesson?.preview || getReadingPreviewText(settings.readingLanguage);
  const isReaderContext = previewRoute?.name === 'lesson';

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
          title="Reading Language"
          subtitle="Applied only inside the reader."
        />
        <View style={styles.segmentedRow}>
          {readingLanguageChoices.map(choice => (
            <SegmentButton
              key={choice.id}
              styles={styles}
              label={choice.nativeLabel}
              active={settings.readingLanguage === choice.id}
              onPress={() => onUpdateReadingLanguage(choice.id)}
            />
          ))}
        </View>
        <Text style={styles.helperText}>
          {getReadingLanguageLabel(settings.readingLanguage)} selected for the
          reading view when that lesson is available in the chosen language.
        </Text>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={isReaderContext ? 'Live Reader Preview' : 'Reader Preview'}
          subtitle={
            isReaderContext
              ? 'Theme, text size, line height, and language update here immediately.'
              : 'Reader-only changes update here immediately before you go back.'
          }
        />
        <View style={styles.previewLanguageRow}>
          <Text style={styles.previewLanguageLabel}>
            {getReadingLanguageNativeLabel(settings.readingLanguage)}
          </Text>
        </View>
        <Text style={styles.settingsPreviewHeading}>{previewHeading}</Text>
        <Text
          style={[
            styles.settingsPreview,
            {
              fontFamily:
                settings.readingLanguage === 'en' ||
                settings.readingLanguage === 'om'
                  ? resolveFontFamily(settings.fontChoice)
                  : undefined,
              fontSize: 18 * settings.fontScale,
              lineHeight: 18 * settings.fontScale * settings.lineHeight,
            },
          ]}
        >
          {previewBody}
        </Text>
      </GlassCard>

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
          subtitle="Each option keeps its own preview sample."
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
              <Text
                style={[
                  styles.fontChoiceSample,
                  { fontFamily: resolveFontFamily(choice.id) },
                ]}
              >
                Aa
              </Text>
              <Text style={styles.fontChoiceLabel}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Saved"
          subtitle="Quick access to bookmarks, highlights, and notes."
        />
        <View style={styles.summaryStatGrid}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {savedSummary.favorites}
            </Text>
            <Text style={styles.summaryStatLabel}>Saved lessons</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {savedSummary.highlights}
            </Text>
            <Text style={styles.summaryStatLabel}>Highlights</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>{savedSummary.notes}</Text>
            <Text style={styles.summaryStatLabel}>Notes</Text>
          </View>
        </View>
        <Pressable onPress={onOpenSaved} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open Saved</Text>
        </Pressable>
      </GlassCard>
    </ScrollView>
  );
}
