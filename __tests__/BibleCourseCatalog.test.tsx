import React from 'react';
import renderer from 'react-test-renderer';
import { Platform, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleCourseCatalog } from '../src/app/components/BibleCourseCatalog';
import { StudyCompletionToggle } from '../src/app/components/StudyCompletionToggle';
import { initialStudyRoomCourse } from '../src/data/studyRoom';
import { createStyles } from '../src/app/styles';
import { palettes, resolveAppTypography, fontChoices } from '../src/design';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/slider', () => 'Slider');

test.each(Object.keys(palettes) as Array<keyof typeof palettes>)(
  'course titles follow the font and colors in %s theme',
  theme => {
    for (const font of fontChoices) {
      const typography = resolveAppTypography(font.id, 'en');
      const styles = createStyles(palettes[theme], typography);
      expect(StyleSheet.flatten(styles.bookStackTitle).color).toBe('#ffffff');
      expect(StyleSheet.flatten(styles.courseLessonTitle)).toMatchObject({
        fontFamily: typography.reading,
        color: palettes[theme].foreground,
      });
      expect(StyleSheet.flatten(styles.courseStudyRow).borderBottomWidth).toBe(
        StyleSheet.hairlineWidth,
      );
    }
  },
);

test('iOS course completion uses a drawn checkmark and does not show removed supplement cards', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'ios');
  await AsyncStorage.clear();
  const styles = createStyles(
    palettes.dark,
    resolveAppTypography('cabin', 'en'),
  );
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <BibleCourseCatalog
        course={initialStudyRoomCourse}
        language="en"
        courseSeries={[]}
        styles={styles}
        onOpenStudyRoom={jest.fn()}
        onOpenSeries={jest.fn()}
      />,
    );
  });
  const texts = tree.root
    .findAllByType(Text)
    .map(item => React.Children.toArray(item.props.children).join(''));
  for (const supplement of [
    initialStudyRoomCourse.fullCourse,
    initialStudyRoomCourse.printableHtml,
    initialStudyRoomCourse.whereNext,
  ])
    expect(texts.some(text => text.includes(supplement.title))).toBe(false);
  expect(texts.some(text => /[☐☑]/u.test(text))).toBe(false);
  const toggle = tree.root.findAllByType(StudyCompletionToggle)[0];
  await renderer.act(async () => {
    toggle.props.onPress();
  });
  expect(
    tree.root.findAllByProps({ testID: 'study-checkmark' }).length,
  ).toBeGreaterThan(0);
  await renderer.act(async () => {
    tree.unmount();
  });
  platform.restore();
});
