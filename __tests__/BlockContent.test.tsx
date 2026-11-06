import React from 'react';
import renderer from 'react-test-renderer';
import { Platform, StyleSheet, View } from 'react-native';
import { BlockContent } from '../src/components/BlockContent';
import { palettes, resolveAppTypography } from '../src/design';
import { defaultStorageState } from '../src/storage';

const mockInjectJavaScript = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-webview', () => {
  const ReactModule = require('react');
  const Native = require('react-native');
  return {
    WebView: ReactModule.forwardRef((props: object, ref: unknown) => {
      ReactModule.useImperativeHandle(ref, () => ({
        injectJavaScript: mockInjectJavaScript,
      }));
      return <Native.View {...props} testID="reader-webview" />;
    }),
  };
});

test('Android reader handles height changes and restores saved annotations after renderer recovery', async () => {
  jest.useFakeTimers();
  const originalPlatform = Platform.OS;
  Platform.OS = 'android';
  const onSelectText = jest.fn(),
    onSelectionDragChange = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  try {
    await renderer.act(async () => {
      tree = renderer.create(
        <BlockContent
          blocks={[
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: 'A chapter with a saved note.' },
              ],
            },
          ]}
          lessonSlug="chapter"
          settings={defaultStorageState.readerSettings}
          highlights={[
            {
              id: 'chapter:chars:0-8',
              text: 'A chapter',
              note: 'Saved note',
              style: 'underline',
              createdAt: '2026-10-30',
            },
          ]}
          palette={palettes.dark}
          typography={resolveAppTypography('cabin', 'en')}
          onSelectText={onSelectText}
          onSelectionDragChange={onSelectionDragChange}
          onOpenLink={jest.fn()}
        />,
      );
    });
    const worker = () => tree.root.findByProps({ testID: 'reader-webview' });
    const script = worker().props.source.html.match(
      /<script>([\s\S]*)<\/script>/,
    )[1];
    // Compile the generated WebView program without executing DOM code in Jest.
    // eslint-disable-next-line no-new-func
    expect(() => new Function(script)).not.toThrow();
    const message = (payload: object) =>
      worker().props.onMessage({
        nativeEvent: { data: JSON.stringify(payload) },
      });
    await renderer.act(async () => {
      message({ type: 'fontReady' });
      message({ type: 'height', height: 1200 });
    });
    expect(
      StyleSheet.flatten(tree.root.findAllByType(View)[0].props.style).height,
    ).toBe(1200);
    await renderer.act(async () => {
      message({ type: 'height', height: 800 });
    });
    expect(
      StyleSheet.flatten(tree.root.findAllByType(View)[0].props.style).height,
    ).toBe(800);
    expect(
      mockInjectJavaScript.mock.calls.some(([scriptText]) =>
        scriptText.includes('Saved note'),
      ),
    ).toBe(true);
    await renderer.act(async () => {
      worker().props.onRenderProcessGone({ nativeEvent: { didCrash: true } });
    });
    expect(tree.root.findAllByProps({ testID: 'reader-webview' })).toHaveLength(
      0,
    );
    expect(onSelectText).toHaveBeenCalledWith(null);
    expect(onSelectionDragChange).toHaveBeenCalledWith(false);
    mockInjectJavaScript.mockClear();
    await renderer.act(async () => {
      tree.root
        .findAllByProps({ accessibilityRole: 'button' })[0]
        .props.onPress();
    });
    await renderer.act(async () => {
      message({ type: 'fontReady' });
    });
    expect(
      mockInjectJavaScript.mock.calls.some(([scriptText]) =>
        scriptText.includes('Saved note'),
      ),
    ).toBe(true);
  } finally {
    if (tree)
      await renderer.act(async () => {
        tree.unmount();
      });
    Platform.OS = originalPlatform;
    jest.useRealTimers();
  }
});
