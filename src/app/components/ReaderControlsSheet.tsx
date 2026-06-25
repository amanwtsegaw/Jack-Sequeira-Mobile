import React from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {
  fontChoices,
  fontScaleOptions,
  getValueIndex,
  lineHeightOptions,
  type AppPalette,
  type FontChoice,
} from '../../design';
import {type ReaderSettings} from '../../storage';
import {labelForLineHeight, labelForScale} from '../utils';
import {type AppStyles} from '../styles';
import {SegmentButton, StepSliderControl} from './Shared';

export function ReaderControlsSheet({
  open,
  styles,
  settings,
  palette,
  onClose,
  onOpenFullSettings,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onBumpFontScale,
  onBumpLineHeight,
  onUpdateFontScaleByIndex,
  onUpdateLineHeightByIndex,
}: {
  open: boolean;
  styles: AppStyles;
  settings: ReaderSettings;
  palette: AppPalette;
  onClose: () => void;
  onOpenFullSettings: () => void;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onBumpFontScale: (direction: -1 | 1) => void;
  onBumpLineHeight: (direction: -1 | 1) => void;
  onUpdateFontScaleByIndex: (index: number) => void;
  onUpdateLineHeightByIndex: (index: number) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
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
              <Text style={styles.sheetTitle}>Reading Controls</Text>
              <Pressable onPress={onClose} style={styles.sheetCloseButton}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.segmentedRow}>
              <SegmentButton
                styles={styles}
                label="Dark"
                active={settings.themeMode === 'dark'}
                onPress={() => onUpdateThemeMode('dark')}
              />
              <SegmentButton
                styles={styles}
                label="Sepia"
                active={settings.themeMode === 'sepia'}
                onPress={() => onUpdateThemeMode('sepia')}
              />
              <SegmentButton
                styles={styles}
                label="Light"
                active={settings.themeMode === 'light'}
                onPress={() => onUpdateThemeMode('light')}
              />
            </View>

            <StepSliderControl
              styles={styles}
              palette={palette}
              label="Font size"
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
              label="Line height"
              valueLabel={labelForLineHeight(settings.lineHeight)}
              valueIndex={getValueIndex(lineHeightOptions, settings.lineHeight)}
              maximum={lineHeightOptions.length - 1}
              onDecrease={() => onBumpLineHeight(-1)}
              onIncrease={() => onBumpLineHeight(1)}
              onChange={onUpdateLineHeightByIndex}
            />

            <View style={styles.inlineSection}>
              <Text style={styles.inlineSectionTitle}>Font</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlineFontRow}>
                {fontChoices.map(choice => (
                  <Pressable
                    key={choice.id}
                    onPress={() => onUpdateFontChoice(choice.id)}
                    style={[
                      styles.inlineFontChip,
                      settings.fontChoice === choice.id && styles.inlineFontChipActive,
                    ]}>
                    <Text style={styles.inlineFontChipText}>{choice.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Pressable onPress={onOpenFullSettings} style={styles.fullSettingsButton}>
              <Text style={styles.fullSettingsText}>Open full settings</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
