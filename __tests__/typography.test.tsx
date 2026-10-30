import React from 'react';
import renderer from 'react-test-renderer';
import { Text, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, AppTextInput, TypographyProvider } from '../src/typography';
import {
  defaultLineHeight,
  getEffectiveFontChoice,
  getFontChoices,
  lineHeightOptions,
  resolveAppTypography,
  palettes,
} from '../src/design';
import { defaultStorageState, loadStorageState } from '../src/storage';
import { labelForLineHeight } from '../src/app/utils';
import { createStyles } from '../src/app/styles';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

test.each(['am', 'tm'] as const)(
  '%s defaults to Menbere and offers Nokia explicitly',
  lang => {
    expect(getFontChoices(lang).map(c => c.id)).toEqual(['menbere', 'nokia']);
    expect(getEffectiveFontChoice('cabin', lang)).toBe('menbere');
    expect(resolveAppTypography('cabin', lang)).toEqual({
      ui: 'Menbere-Regular',
      reading: 'Menbere-Regular',
    });
    expect(resolveAppTypography('nokia', lang)).toEqual({
      ui: 'NokiaPureHeadline-Regular',
      reading: 'NokiaPureHeadline-Regular',
    });
  },
);
test('font selection applies to static text, backend text and text inputs', async () => {
  let tree!: renderer.ReactTestRenderer;
  const value = resolveAppTypography('lexend', 'ru');
  await renderer.act(async () => {
    tree = renderer.create(
      <TypographyProvider value={value}>
        <AppText>Static label</AppText>
        <AppText>Backend text</AppText>
        <AppTextInput value="Response" />
      </TypographyProvider>,
    );
  });
  for (const node of tree.root.findAllByType(Text))
    expect(StyleSheet.flatten(node.props.style).fontFamily).toBe(
      'Lexend-Regular',
    );
  expect(
    StyleSheet.flatten(tree.root.findByType(TextInput).props.style).fontFamily,
  ).toBe('Lexend-Regular');
  await renderer.act(async () => {
    tree.unmount();
  });
});
test('Compact is the default and supports smaller and larger spacing', async () => {
  expect(defaultStorageState.readerSettings.lineHeight).toBe(defaultLineHeight);
  expect(labelForLineHeight(defaultLineHeight)).toBe('Compact');
  expect(lineHeightOptions.filter(v => v < defaultLineHeight)).toHaveLength(4);
  expect(lineHeightOptions.at(-1)).toBeGreaterThan(2.2);
  await AsyncStorage.setItem(
    'jack-sequeira-mobile-state',
    JSON.stringify({
      readerSettings: {
        lineHeight: 1.75,
        fontChoice: 'cabin',
        readingLanguage: 'am',
      },
    }),
  );
  const saved = await loadStorageState();
  expect(saved.readerSettings.lineHeight).toBe(defaultLineHeight);
  expect(saved.readerSettings.ethiopicFontChoice).toBe('menbere');
  await AsyncStorage.setItem(
    'jack-sequeira-mobile-state',
    JSON.stringify({
      readerSettings: {
        typographyVersion: 2,
        lineHeight: 1.25,
        fontChoice: 'nokia',
        ethiopicFontChoice: 'nokia',
        readingLanguage: 'tm',
      },
    }),
  );
  expect((await loadStorageState()).readerSettings.lineHeight).toBe(1.25);
});
test('study reader leaves twenty-two pixels at either edge', () => {
  const styles = createStyles(
    palettes.dark,
    resolveAppTypography('cabin', 'en'),
  );
  expect(styles.readerScrollContentWithFixedHeader.paddingHorizontal).toBe(22);
  expect(styles.readerContentWrap.paddingHorizontal).toBe(0);
});

test('Ethiopic headings reserve enough line height for upper marks', async () => {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <TypographyProvider value={resolveAppTypography('menbere', 'am')}>
        <AppText style={{ fontSize: 39, lineHeight: 44 }}>በእምነት ጽድቅ</AppText>
      </TypographyProvider>,
    );
  });
  const heading = tree.root.findByType(Text);
  expect(
    StyleSheet.flatten(heading.props.style).lineHeight,
  ).toBeGreaterThanOrEqual(58.5);
  await renderer.act(async () => {
    tree.unmount();
  });
});
