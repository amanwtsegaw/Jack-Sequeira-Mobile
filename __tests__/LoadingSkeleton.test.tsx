import React from 'react';
import renderer from 'react-test-renderer';
import { AccessibilityInfo, Animated } from 'react-native';
import { LoadingSkeleton } from '../src/app/components/LoadingSkeleton';
import { palettes } from '../src/design';

afterEach(() => jest.restoreAllMocks());
test('reduced motion uses static, accessible loading placeholders', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const loop = jest.spyOn(Animated, 'loop');
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <LoadingSkeleton
        palette={palettes.dark}
        variant="reader"
        label="Loading chapter"
      />,
    );
  });
  expect(
    tree.root.findByProps({ accessibilityLabel: 'Loading chapter' }).props
      .accessibilityState,
  ).toEqual({ busy: true });
  expect(loop).not.toHaveBeenCalled();
  await renderer.act(async () => {
    tree.unmount();
  });
});
test('shimmer starts when motion is allowed and stops when loading finishes', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  jest.spyOn(Animated, 'loop').mockReturnValue(animation);
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<LoadingSkeleton palette={palettes.light} />);
  });
  expect(animation.start).toHaveBeenCalledTimes(1);
  await renderer.act(async () => {
    tree.unmount();
  });
  expect(animation.stop).toHaveBeenCalledTimes(1);
});
