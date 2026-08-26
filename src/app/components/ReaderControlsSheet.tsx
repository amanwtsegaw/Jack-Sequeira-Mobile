import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import {
  fontChoices,
  fontScaleOptions,
  getValueIndex,
  lineHeightOptions,
  readingLanguageChoices,
  resolveFontFamily,
  themeChoices,
  type AppPalette,
  type FontChoice,
} from '../../design';
import { type ReaderSettings } from '../../storage';
import { type StaticText } from '../../i18n/staticText';
import { labelForLineHeight, labelForScale } from '../utils';
import { type AppStyles } from '../styles';
import { SegmentButton, StepSliderControl } from './Shared';

export function ReaderControlsSheet({
  open,
  styles,
  staticText,
  settings,
  palette,
  onClose,
  onOpenFullSettings,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onUpdateReadingLanguage,
  onBumpFontScale,
  onBumpLineHeight,
  onUpdateFontScaleByIndex,
  onUpdateLineHeightByIndex,
}: {
  open: boolean;
  styles: AppStyles;
  staticText: StaticText;
  settings: ReaderSettings;
  palette: AppPalette;
  onClose: () => void;
  onOpenFullSettings: () => void;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onUpdateReadingLanguage: (
    readingLanguage: ReaderSettings['readingLanguage'],
  ) => void;
  onBumpFontScale: (direction: -1 | 1) => void;
  onBumpLineHeight: (direction: -1 | 1) => void;
  onUpdateFontScaleByIndex: (index: number) => void;
  onUpdateLineHeightByIndex: (index: number) => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.sheetWrap}>
          <BlurView
            style={styles.sheetBlur}
            blurAmount={30}
            blurType={palette.blurTint}
            reducedTransparencyFallbackColor={palette.surfaceHigh}
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                {staticText.readerControls.title}
              </Text>
              <Pressable onPress={onClose} style={styles.sheetCloseButton}>
                <Text style={styles.sheetCloseText}>
                  {staticText.reader.done}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inlineSection}>
              <Text style={styles.inlineSectionTitle}>
                {staticText.readerControls.language}
              </Text>
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
            </View>

            <View style={styles.inlineSection}>
              <Text style={styles.inlineSectionTitle}>
                {staticText.readerControls.theme}
              </Text>
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
            </View>

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

            <View style={styles.inlineSection}>
              <Text style={styles.inlineSectionTitle}>
                {staticText.readerControls.readingFont}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlineFontRow}
              >
                {fontChoices.map(choice => (
                  <Pressable
                    key={choice.id}
                    onPress={() => onUpdateFontChoice(choice.id)}
                    style={[
                      styles.inlineFontChip,
                      settings.fontChoice === choice.id &&
                        styles.inlineFontChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inlineFontChipText,
                        { fontFamily: resolveFontFamily(choice.id) },
                      ]}
                    >
                      {choice.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Pressable
              onPress={onOpenFullSettings}
              style={styles.fullSettingsButton}
            >
              <Text style={styles.fullSettingsText}>
                {staticText.readerControls.openFullSettings}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
