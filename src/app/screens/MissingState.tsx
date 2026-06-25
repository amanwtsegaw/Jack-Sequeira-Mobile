import React from 'react';
import {Text, View} from 'react-native';
import {type AppStyles} from '../styles';
import {PillButton} from '../components/Shared';

export function MissingState({
  styles,
  onBack,
}: {
  styles: AppStyles;
  onBack: () => void;
}) {
  return (
    <View style={styles.centeredScreen}>
      <Text style={styles.sectionTitle}>Content not found</Text>
      <Text style={styles.bodyMuted}>
        This item could not be loaded from the local archive bundle.
      </Text>
      <PillButton styles={styles} label="Go back" onPress={onBack} />
    </View>
  );
}
