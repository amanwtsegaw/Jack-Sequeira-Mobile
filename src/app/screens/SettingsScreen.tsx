import React, { useState } from 'react';
import {
  Linking,
  NativeModules,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  fontChoices,
  fontScaleOptions,
  getValueIndex,
  getReadingLanguageLabel,
  getReadingLanguageNativeLabel,
  getReadingPreviewText,
  lineHeightOptions,
  readingLanguageChoices,
  amharicTypography,
  resolveFontFamily,
  themeChoices,
  type AppPalette,
  type FontChoice,
} from '../../design';
import { type ArchiveLesson } from '../../data/archive';
import { formatStaticText, type StaticText } from '../../i18n/staticText';
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
  staticText,
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
  onOpenAbout,
  savedSummary,
  cacheSummary,
  downloadedAudioSummary,
}: {
  styles: AppStyles;
  staticText: StaticText;
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
  onOpenAbout: () => void;
  savedSummary: {
    favorites: number;
    highlights: number;
    notes: number;
  };
  cacheSummary: {
    bytes: number;
    catalogCount: number;
    seriesCount: number;
    lessonCount: number;
    updatedAt: string | null;
  };
  downloadedAudioSummary: {
    bytes: number;
    count: number;
  };
}) {
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const previewHeading =
    previewLesson?.title ??
    `${getReadingLanguageLabel(settings.readingLanguage)} Reader`;
  const previewBody =
    previewLesson?.preview || getReadingPreviewText(settings.readingLanguage);
  const isReaderContext = previewRoute?.name === 'lesson';
  const selectedLanguage = readingLanguageChoices.find(
    choice => choice.id === settings.readingLanguage,
  );
  const appVersion = getAppVersion();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassHeader
        styles={styles}
        title={staticText.settings.title}
        leftAction={{
          icon: '‹',
          label: staticText.navigation.back,
          onPress: onBack,
        }}
      />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.settings.readingLanguage}
          subtitle={staticText.settings.readingLanguageSubtitle}
        />
        <View style={styles.languageDropdownWrap}>
          <Pressable
            onPress={() => setLanguageMenuOpen(open => !open)}
            style={styles.languageDropdownButton}
          >
            <View style={styles.languageDropdownTextWrap}>
              <Text style={styles.languageDropdownLabel}>
                {staticText.settings.selectedLanguage}
              </Text>
              <Text style={styles.languageDropdownValue}>
                {selectedLanguage?.nativeLabel ?? 'English'}
              </Text>
            </View>
            <Text style={styles.languageDropdownChevron}>
              {languageMenuOpen ? '⌃' : '⌄'}
            </Text>
          </Pressable>
          {languageMenuOpen ? (
            <View style={styles.languageDropdownMenu}>
              {readingLanguageChoices.map(choice => {
                const active = settings.readingLanguage === choice.id;
                return (
                  <Pressable
                    key={choice.id}
                    onPress={() => {
                      onUpdateReadingLanguage(choice.id);
                      setLanguageMenuOpen(false);
                    }}
                    style={[
                      styles.languageDropdownOption,
                      active && styles.languageDropdownOptionActive,
                    ]}
                  >
                    <View style={styles.languageDropdownOptionTextWrap}>
                      <Text
                        style={[
                          styles.languageDropdownOptionNative,
                          active && styles.languageDropdownOptionNativeActive,
                        ]}
                      >
                        {choice.nativeLabel}
                      </Text>
                      <Text style={styles.languageDropdownOptionLabel}>
                        {choice.label}
                      </Text>
                    </View>
                    {active ? (
                      <Text style={styles.languageDropdownCheck}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <Text style={styles.helperText}>
          {formatStaticText(staticText.settings.languageSelectedHelper, {
            language: getReadingLanguageLabel(settings.readingLanguage),
          })}
        </Text>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="About"
          subtitle="Read about E.H. Jack and Jean Sequeira, the ministry history, tributes, and the family letter."
        />
        <Pressable onPress={onOpenAbout} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open About</Text>
        </Pressable>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.settings.theme}
          subtitle={staticText.settings.themeSubtitle}
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
          title={staticText.settings.readerDisplay}
          subtitle={staticText.settings.readerDisplaySubtitle}
        />
        <StepSliderControl
          styles={styles}
          palette={palette}
          label={staticText.readerControls.textSize}
          valueLabel={labelForScale(settings.fontScale)}
          valueIndex={getValueIndex(fontScaleOptions, settings.fontScale)}
          maximum={fontScaleOptions.length - 1}
          onDecrease={() => onBumpFontScale(-1)}
          onIncrease={() => onBumpFontScale(1)}
          onChange={onUpdateFontScaleByIndex}
        />
        <StepSliderControl
          styles={styles}
          palette={palette}
          label={staticText.readerControls.lineHeight}
          valueLabel={labelForLineHeight(settings.lineHeight)}
          valueIndex={getValueIndex(lineHeightOptions, settings.lineHeight)}
          maximum={lineHeightOptions.length - 1}
          onDecrease={() => onBumpLineHeight(-1)}
          onIncrease={() => onBumpLineHeight(1)}
          onChange={onUpdateLineHeightByIndex}
        />
        <SectionHeader
          styles={styles}
          title={
            isReaderContext
              ? staticText.settings.liveReaderPreview
              : staticText.settings.readerPreview
          }
          subtitle={
            isReaderContext
              ? staticText.settings.liveReaderPreviewSubtitle
              : staticText.settings.readerPreviewSubtitle
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
                  : settings.readingLanguage === 'am'
                  ? amharicTypography.reading
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
          title={staticText.settings.readingFont}
          subtitle={staticText.settings.readingFontSubtitle}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fontChoiceGrid}
        >
          {chunkFontChoices(fontChoices, 2).map((column, columnIndex) => (
            <View
              key={`font-column-${columnIndex}`}
              style={styles.fontChoiceColumn}
            >
              {column.map(choice => (
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
          ))}
        </ScrollView>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.settings.cache}
          subtitle={staticText.settings.cacheSubtitle}
        />
        <View style={styles.summaryStatGrid}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {formatCacheBytes(cacheSummary.bytes)}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.storedData}
            </Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {formatCacheBytes(downloadedAudioSummary.bytes)}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.downloadedAudio}
            </Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {cacheSummary.seriesCount + cacheSummary.catalogCount}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.seriesEntries}
            </Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {cacheSummary.lessonCount}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.lessons}
            </Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          {downloadedAudioSummary.count > 0
            ? `${formatStaticText(staticText.settings.downloadedAudioSummary, {
                count: downloadedAudioSummary.count,
                plural: downloadedAudioSummary.count === 1 ? '' : 's',
              })} `
            : ''}
          {cacheSummary.updatedAt
            ? formatStaticText(staticText.settings.lastUpdated, {
                date: formatCacheDate(cacheSummary.updatedAt),
              })
            : staticText.settings.noCachedContent}
        </Text>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.saved.title}
          subtitle={staticText.settings.savedSubtitle}
        />
        <View style={styles.summaryStatGrid}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {savedSummary.favorites}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.savedLessons}
            </Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>
              {savedSummary.highlights}
            </Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.highlights}
            </Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatValue}>{savedSummary.notes}</Text>
            <Text style={styles.summaryStatLabel}>
              {staticText.settings.notes}
            </Text>
          </View>
        </View>
        <Pressable onPress={onOpenSaved} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {staticText.settings.openSaved}
          </Text>
        </Pressable>
      </GlassCard>

      <View style={styles.settingsFooter}>
        <Pressable
          onPress={() =>
            Linking.openURL('https://jacksequeira.org/contact').catch(
              () => undefined,
            )
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {staticText.common.contactUs}
          </Text>
        </Pressable>
        <Text style={styles.settingsVersionText}>
          {formatStaticText(staticText.common.version, { version: appVersion })}
        </Text>
        <Text style={styles.settingsDeveloperText}>
          {staticText.common.developedBy}
        </Text>
      </View>
    </ScrollView>
  );
}

function chunkFontChoices<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getAppVersion() {
  const version = (NativeModules as { AppInfo?: { version?: unknown } }).AppInfo
    ?.version;
  return typeof version === 'string' && version.length > 0 ? version : '1.0';
}

function formatCacheBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${bytes} B`;
}

function formatCacheDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
