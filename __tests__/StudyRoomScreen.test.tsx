import React from 'react';
import renderer from 'react-test-renderer';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyRoomScreen } from '../src/app/screens/StudyRoomScreen';
import { initialStudyRoomCourse } from '../src/data/studyRoom';
import { palettes, resolveAppTypography } from '../src/design';
import { createStyles } from '../src/app/styles';
import { defaultStorageState } from '../src/storage';
import { PillButton } from '../src/app/components/Shared';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('../src/components/BlockContent', () => ({
  BlockContent: () => null,
}));
jest.mock('../src/app/screens/LessonScreen', () => ({
  BibleReferenceModal: () => null,
}));
const palette = palettes.dark;
const styles = createStyles(palette, resolveAppTypography('cabin', 'en'));
const course = initialStudyRoomCourse;
function texts(tree: renderer.ReactTestRenderer, value: string) {
  return tree.root
    .findAllByType(Text)
    .filter(
      item => React.Children.toArray(item.props.children).join('') === value,
    );
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
});
afterEach(() => jest.useRealTimers());
async function prepareStudy() {
  await renderer.act(async () => {
    jest.advanceTimersByTime(40);
  });
}

test('introduction shows the shared four-part course path, scroll progress, saved reflection, and next study', async () => {
  const lesson = course.lessons[0],
    onOpen = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <StudyRoomScreen
        course={course}
        lesson={lesson}
        styles={styles}
        palette={palette}
        settings={defaultStorageState.readerSettings}
        onBack={jest.fn()}
        onOpenLesson={onOpen}
      />,
    );
  });
  await prepareStudy();
  expect(texts(tree, 'Four movements, one gospel center')).toHaveLength(1);
  const verse = texts(tree, lesson.keyVerseReference)[0];
  expect(verse.props.children).toBe(lesson.keyVerseReference);
  expect(StyleSheet.flatten(verse.props.style)).toMatchObject({
    textDecorationLine: 'underline',
    textDecorationColor: palette.primarySolid,
    color: palette.foreground,
  });

  for (const part of course.parts)
    expect(texts(tree, part.title)).toHaveLength(1);
  await renderer.act(async () => {
    tree.root.findByType(ScrollView).props.onScroll({
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 1500 },
        layoutMeasurement: { height: 500 },
      },
    });
  });
  expect(texts(tree, '50% read')).toHaveLength(1);
  await renderer.act(async () => {
    tree.root
      .findByProps({ accessibilityLabel: 'Private study notes' })
      .props.onChangeText('My course reflection');
  });
  const next = tree.root
    .findAllByType(PillButton)
    .find(item => item.props.label === `${course.lessons[1].title} →`)!;
  await renderer.act(async () => {
    next.props.onPress();
  });
  expect(onOpen).toHaveBeenCalledWith(course.lessons[1].slug);
  await renderer.act(async () => {
    tree.unmount();
  });
  await renderer.act(async () => {
    tree = renderer.create(
      <StudyRoomScreen
        course={course}
        lesson={lesson}
        styles={styles}
        palette={palette}
        settings={defaultStorageState.readerSettings}
        onBack={jest.fn()}
        onOpenLesson={onOpen}
      />,
    );
  });
  await prepareStudy();
  expect(
    tree.root.findByProps({ accessibilityLabel: 'Private study notes' }).props
      .value,
  ).toBe('My course reflection');
  await renderer.act(async () => {
    tree.unmount();
  });
});

test('study answers stay hidden until comparison and written responses remain editable', async () => {
  const lesson = course.lessons.find(item => item.code === '1')!,
    question = lesson.sections[0].questions[0];
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <StudyRoomScreen
        course={course}
        lesson={lesson}
        styles={styles}
        palette={palette}
        settings={defaultStorageState.readerSettings}
        onBack={jest.fn()}
        onOpenLesson={jest.fn()}
      />,
    );
  });
  await prepareStudy();
  const answer = question.guidance ?? question.answer!;
  expect(texts(tree, answer)).toHaveLength(0);
  const input = tree.root
    .findAllByType(TextInput)
    .find(item => item.props.accessibilityLabel === 'Response to question 1')!;
  await renderer.act(async () => {
    input.props.onChangeText('My answer from Scripture');
  });
  expect(
    tree.root
      .findAllByType(TextInput)
      .find(item => item.props.accessibilityLabel === 'Response to question 1')!
      .props.value,
  ).toBe('My answer from Scripture');
  await renderer.act(async () => {
    tree.root
      .findAllByType(PillButton)
      .find(item => item.props.label === 'Compare response')!
      .props.onPress();
  });
  expect(texts(tree, answer)).toHaveLength(1);
  await renderer.act(async () => {
    tree.unmount();
  });
});

test('scrolling to the end persists 100 percent progress and completes the study', async () => {
  const lesson = course.lessons[0];
  let tree!: renderer.ReactTestRenderer;
  const props = {
    course,
    lesson,
    styles,
    palette,
    settings: defaultStorageState.readerSettings,
    onBack: jest.fn(),
    onOpenLesson: jest.fn(),
  };
  await renderer.act(async () => {
    tree = renderer.create(<StudyRoomScreen {...props} />);
  });
  expect(
    tree.root.findAllByProps({ testID: 'loading-skeleton' }).length,
  ).toBeGreaterThan(0);
  await prepareStudy();
  await renderer.act(async () => {
    const reader = tree.root.findByType(ScrollView);
    reader.props.onScrollBeginDrag();
    reader.props.onScroll({
      nativeEvent: {
        contentOffset: { y: 1000 },
        contentSize: { height: 1500 },
        layoutMeasurement: { height: 500 },
      },
    });
    reader.props.onScrollEndDrag();
  });
  expect(texts(tree, '100% read')).toHaveLength(1);
  expect(
    tree.root.findAllByProps({ testID: 'study-checkmark' }).length,
  ).toBeGreaterThan(0);
  await renderer.act(async () => {
    tree.unmount();
  });
  await renderer.act(async () => {
    tree = renderer.create(<StudyRoomScreen {...props} />);
  });
  await prepareStudy();
  expect(texts(tree, '100% read')).toHaveLength(1);
  expect(
    tree.root.findAllByProps({ testID: 'study-checkmark' }).length,
  ).toBeGreaterThan(0);
  await renderer.act(async () => {
    tree.unmount();
  });
});
