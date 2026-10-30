import { AppText as Text } from '../../typography';
import React from 'react';
import { Pressable, View } from 'react-native';
import type { AppStyles } from '../styles';

// Border shapes render consistently on iOS and Android, regardless of the reading font.
export function StudyCompletionToggle({
  styles,
  checked,
  disabled,
  label,
  onPress,
}: {
  styles: AppStyles;
  checked: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.studyCompletionButton}
    >
      <View
        accessible={false}
        style={[styles.studyCheckbox, checked && styles.studyCheckboxChecked]}
      >
        {checked ? (
          <View testID="study-checkmark" style={styles.studyCheckmark} />
        ) : null}
      </View>
      <Text style={styles.studyCompletionLabel}>
        {checked ? 'Completed' : 'Mark complete'}
      </Text>
    </Pressable>
  );
}
