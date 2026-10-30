import React from 'react';
import renderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudyWorkbook } from '../src/hooks/useStudyWorkbook';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

test('answers, revealed comparisons, notes, active study and completion survive leaving and reopening', async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  let current!: ReturnType<typeof useStudyWorkbook>;
  function Probe() {
    current = useStudyWorkbook();
    return null;
  }
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<Probe />);
  });
  expect(current.ready).toBe(true);
  await renderer.act(async () => {
    current.update('why-you-need-a-savior', {
      responses: { '0-0': 'My answer' },
      revealed: ['0-0'],
      notes: 'A reflection',
      complete: true,
    });
    current.activate('why-you-need-a-savior');
  });
  // Unmount before the debounced save fires, as happens on next-study navigation.
  await renderer.act(async () => {
    tree.unmount();
  });
  await renderer.act(async () => {
    tree = renderer.create(<Probe />);
  });
  expect(current.book.activeSlug).toBe('why-you-need-a-savior');
  expect(current.book.lessons['why-you-need-a-savior']).toEqual({
    readingProgress: 0,
    scrollRatio: 0,
    responses: { '0-0': 'My answer' },
    revealed: ['0-0'],
    notes: 'A reflection',
    complete: true,
  });
  await renderer.act(async () => {
    tree.unmount();
  });
  jest.useRealTimers();
});
