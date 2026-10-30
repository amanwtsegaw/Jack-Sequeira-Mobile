import React, { createContext, forwardRef, useContext } from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  type TextProps,
  type TextInputProps,
} from 'react-native';
import type { AppTypography } from './design';
const TypographyContext = createContext<AppTypography>({
  ui: 'Cabin-Regular',
  reading: 'Cabin-Regular',
});
export const TypographyProvider = TypographyContext.Provider;
export const AppText = forwardRef<Text, TextProps>((props, ref) => {
  const typography = useContext(TypographyContext);
  const resolved = StyleSheet.flatten(props.style) ?? {};
  const family = resolved.fontFamily ?? typography.ui;
  const ethiopic =
    family === 'Menbere-Regular' || family.startsWith('NokiaPureHeadline');
  const headingMetrics =
    ethiopic && (resolved.fontSize ?? 0) >= 20
      ? {
          lineHeight: Math.max(
            resolved.lineHeight ?? 0,
            (resolved.fontSize ?? 20) * 1.5,
          ),
          includeFontPadding: true,
        }
      : undefined;
  return (
    <Text
      key={family}
      {...props}
      ref={ref}
      style={[{ fontFamily: typography.ui }, props.style, headingMetrics]}
    />
  );
});
AppText.displayName = 'AppText';
export const AppTextInput = forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    const typography = useContext(TypographyContext);
    return (
      <TextInput
        {...props}
        ref={ref}
        style={[{ fontFamily: typography.reading }, props.style]}
      />
    );
  },
);
AppTextInput.displayName = 'AppTextInput';
