import { LoadingSkeleton } from '../app/components/LoadingSkeleton';
import { androidReaderSelectionScript } from './androidReaderSelection';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  Block,
  Inline,
  LinkInline,
  TextInline,
  VerseNumberInline,
} from '../content/schema';
import {
  getReaderCssFontStack,
  type AppPalette,
  type AppTypography,
} from '../design';
import type { LessonHighlight, ReaderSettings } from '../storage';

const readerFontAssets = [
  {
    family: 'Menbere-Regular',
    fileName: 'Menbere-Regular.ttf',
    uri: resolveFontAssetUri(
      'Menbere-Regular.ttf',
      require('../assets/fonts/Menbere-Regular.ttf'),
    ),
  },
  {
    family: 'NokiaPureHeadline-Regular',
    fileName: 'NokiaPureHeadline-Regular.ttf',
    uri: resolveFontAssetUri(
      'NokiaPureHeadline-Regular.ttf',
      require('../assets/fonts/NokiaPureHeadline-Regular.ttf'),
    ),
  },
  {
    family: 'NokiaPureHeadline-Bold',
    fileName: 'NokiaPureHeadline-Bold.ttf',
    uri: resolveFontAssetUri(
      'NokiaPureHeadline-Bold.ttf',
      require('../assets/fonts/NokiaPureHeadline-Bold.ttf'),
    ),
  },
  {
    family: 'Cabin-Regular',
    fileName: 'Cabin-Regular.ttf',
    uri: resolveFontAssetUri(
      'Cabin-Regular.ttf',
      require('../assets/fonts/Cabin-Regular.ttf'),
    ),
  },
  {
    family: 'cabin',
    fileName: 'Cabin-Regular.ttf',
    uri: resolveFontAssetUri(
      'Cabin-Regular.ttf',
      require('../assets/fonts/Cabin-Regular.ttf'),
    ),
  },
  {
    family: 'Cabin_Condensed-Regular',
    fileName: 'Cabin_Condensed-Regular.ttf',
    uri: resolveFontAssetUri(
      'Cabin_Condensed-Regular.ttf',
      require('../assets/fonts/Cabin_Condensed-Regular.ttf'),
    ),
  },
  {
    family: 'cabin_condensed',
    fileName: 'Cabin_Condensed-Regular.ttf',
    uri: resolveFontAssetUri(
      'Cabin_Condensed-Regular.ttf',
      require('../assets/fonts/Cabin_Condensed-Regular.ttf'),
    ),
  },
  {
    family: 'Raedex',
    fileName: 'Raedex.ttf',
    uri: resolveFontAssetUri(
      'Raedex.ttf',
      require('../assets/fonts/Raedex.ttf'),
    ),
  },
  {
    family: 'Lexend-Regular',
    fileName: 'Lexend-Regular.ttf',
    uri: resolveFontAssetUri(
      'Lexend-Regular.ttf',
      require('../assets/fonts/Lexend-Regular.ttf'),
    ),
  },
  {
    family: 'lexend',
    fileName: 'Lexend-Regular.ttf',
    uri: resolveFontAssetUri(
      'Lexend-Regular.ttf',
      require('../assets/fonts/Lexend-Regular.ttf'),
    ),
  },
  {
    family: 'Quicksand-Regular',
    fileName: 'Quicksand-Regular.ttf',
    uri: resolveFontAssetUri(
      'Quicksand-Regular.ttf',
      require('../assets/fonts/Quicksand-Regular.ttf'),
    ),
  },
  {
    family: 'quicksand',
    fileName: 'Quicksand-Regular.ttf',
    uri: resolveFontAssetUri(
      'Quicksand-Regular.ttf',
      require('../assets/fonts/Quicksand-Regular.ttf'),
    ),
  },
];

function resolveFontAssetUri(fileName: string, asset: number) {
  if (Platform.OS === 'android') {
    return `file:///android_asset/fonts/${fileName}`;
  }

  return Image.resolveAssetSource(asset)?.uri ?? '';
}

function getReaderFontBaseUrl() {
  if (Platform.OS === 'android') {
    return 'file:///android_asset/fonts/';
  }

  const fontUri = readerFontAssets.find(font => font.uri.length > 0)?.uri;
  if (!fontUri) {
    return '';
  }

  return fontUri.slice(0, fontUri.lastIndexOf('/') + 1);
}

export type TextSelection = {
  id: string;
  paragraphKey: string;
  startIndex: number;
  endIndex: number;
  text: string;
};

type ParagraphMeta = {
  paragraphKey: string;
  text: string;
  startCharIndex: number;
  endCharIndex: number;
};

type HighlightRange = {
  startIndex: number;
  endIndex: number;
  highlight: LessonHighlight;
};

type HighlightSyncItem = {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  color?: string;
  style?: 'highlight' | 'underline';
  note?: string;
  createdAt?: string;
  backgroundColor?: string;
  textColor?: string;
  underlineColor?: string;
};

type RenderState = {
  nextCharIndex: number;
  nextAnswerIndex: number;
};

type CharacterToken = {
  charIndex: number;
  text: string;
  classNames: string[];
  highlights: LessonHighlight[];
};

export function BlockContent({
  blocks,
  settings,
  lessonSlug,
  highlights,
  activeSelection,
  palette,
  typography,
  searchTarget,
  onSearchMatch,
  onSelectText,
  onSelectionDragChange,
  onOpenHighlightNote,
  onOpenLink,
  onOpenBibleReference,
}: {
  blocks: Block[];
  settings: ReaderSettings;
  lessonSlug: string;
  highlights: LessonHighlight[];
  activeSelection?: TextSelection | null;
  palette: AppPalette;
  typography: AppTypography;
  searchTarget?: { query: string; nonce: number };
  onSearchMatch?: (offsetY: number) => void;
  onSelectText: (selection: TextSelection | null) => void;
  onSelectionDragChange?: (dragging: boolean) => void;
  onOpenHighlightNote?: (highlight: LessonHighlight) => void;
  onOpenLink: (href: string) => void;
  onOpenBibleReference?: (reference: string) => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const previousSelectionRef = useRef<TextSelection | null>(null);
  const lastHighlightSyncRef = useRef<string | null>(null);
  const [contentHeight, setContentHeight] = useState(1);
  const [contentReady, setContentReady] = useState(false);
  const fontBaseUrl = useMemo(() => getReaderFontBaseUrl(), []);

  const html = useMemo(
    () =>
      buildLessonHtml({
        blocks,
        settings,
        lessonSlug,
        highlights: [],
        palette,
        typography,
        searchTarget,
      }),
    [blocks, settings, lessonSlug, palette, typography, searchTarget],
  );
  const webViewSource = useMemo(
    () => ({ html, baseUrl: fontBaseUrl }),
    [html, fontBaseUrl],
  );
  const highlightSyncPayload = useMemo(
    () =>
      buildHighlightSyncItems({
        blocks,
        lessonSlug,
        highlights,
        palette,
      }),
    [blocks, lessonSlug, highlights, palette],
  );
  const webViewKey = `${lessonSlug}:${settings.fontChoice}:${settings.readingLanguage}`;

  useEffect(() => {
    lastHighlightSyncRef.current = null;
    setContentHeight(1);
    setContentReady(false);
    const fallback = setTimeout(() => {
      setContentReady(true);
    }, 2600);

    return () => clearTimeout(fallback);
  }, [html]);

  useEffect(() => {
    if (previousSelectionRef.current && !activeSelection) {
      webViewRef.current?.injectJavaScript(
        'window.__clearReaderSelection && window.__clearReaderSelection(); true;',
      );
    }
    previousSelectionRef.current = activeSelection ?? null;
  }, [activeSelection]);

  useEffect(() => {
    if (!contentReady) {
      return;
    }

    const serialized = JSON.stringify(highlightSyncPayload);
    if (lastHighlightSyncRef.current === serialized) return;
    lastHighlightSyncRef.current = serialized;
    webViewRef.current?.injectJavaScript(
      `window.__syncReaderHighlights && window.__syncReaderHighlights(${JSON.stringify(
        highlightSyncPayload,
      )}); true;`,
    );
  }, [contentReady, highlightSyncPayload]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as
        | { type: 'height'; height: number }
        | { type: 'fontReady' }
        | { type: 'selection'; selection: TextSelection }
        | { type: 'selectionClear' }
        | { type: 'selectionDrag'; dragging: boolean }
        | { type: 'highlightNote'; highlight: LessonHighlight }
        | { type: 'openLink'; href: string }
        | { type: 'openBibleReference'; reference: string }
        | { type: 'searchMatch'; offsetY: number };

      switch (payload.type) {
        case 'height':
          if (payload.height > 0) {
            setContentHeight(current =>
              Math.abs(current - payload.height) > 1 ? payload.height : current,
            );
          }
          return;
        case 'fontReady':
          setContentReady(true);
          return;
        case 'selection':
          onSelectText(payload.selection);
          return;
        case 'selectionDrag':
          onSelectionDragChange?.(payload.dragging);
          return;
        case 'selectionClear':
          onSelectionDragChange?.(false);
          onSelectText(null);
          return;
        case 'highlightNote':
          onOpenHighlightNote?.(payload.highlight);
          return;
        case 'openLink':
          onOpenLink(payload.href);
          return;
        case 'openBibleReference':
          onOpenBibleReference?.(payload.reference);
          return;
        case 'searchMatch':
          onSearchMatch?.(payload.offsetY);
          return;
      }
    } catch {
      // Ignore malformed bridge messages from the embedded page.
    }
  }

  return (
    <View
      style={[
        styles.container,
        { height: Math.max(contentReady ? 1 : 360, contentHeight) },
      ]}
    >
      {!contentReady ? (
        <View style={styles.loadingOverlay}>
          <LoadingSkeleton
            palette={palette}
            compact
            variant="reader"
            label="Preparing chapter text"
          />
        </View>
      ) : null}
      <WebView
        key={webViewKey}
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        onMessage={handleMessage}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(
            'window.__reportReaderHeight && window.__reportReaderHeight(); true;',
          );
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={[styles.webView, !contentReady && styles.webViewHidden]}
        containerStyle={styles.webViewContainer}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowingReadAccessToURL={fontBaseUrl}
        automaticallyAdjustContentInsets={false}
      />
    </View>
  );
}

function buildLessonHtml({
  blocks,
  settings,
  lessonSlug,
  highlights,
  palette,
  typography,
  searchTarget,
}: {
  blocks: Block[];
  settings: ReaderSettings;
  lessonSlug: string;
  highlights: LessonHighlight[];
  palette: AppPalette;
  typography: AppTypography;
  searchTarget?: { query: string; nonce: number };
}) {
  const selectionDelays =
    Platform.OS === 'android'
      ? { selection: 90, touch: 70, mouse: 30 }
      : { selection: 80, touch: 45, mouse: 30 };
  const paragraphs = collectParagraphs(blocks, lessonSlug);
  const highlightRanges = buildHighlightRanges(
    highlights,
    lessonSlug,
    paragraphs,
  );
  const state: RenderState = { nextCharIndex: 0, nextAnswerIndex: 0 };
  const enableBibleReferences =
    settings.readingLanguage === 'en' || settings.readingLanguage === 'am';
  const enableCourseAnswerFields = lessonSlug.startsWith('bstudy');
  const body = blocks
    .map(block =>
      renderBlock({
        block,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      }),
    )
    .join('');

  const selectionColor = palette.primaryContainer;
  const selectionTextColor = getContrastingTextColor(
    selectionColor,
    palette.blurTint === 'dark',
  );
  const searchHighlightColor =
    palette.blurTint === 'dark' ? '#F7D56A' : '#FFE36A';
  const searchHighlightTextColor = getContrastingTextColor(
    searchHighlightColor,
    palette.blurTint === 'dark',
  );
  const readerFontFamily = typography.reading;
  const readerFontStack = `${cssString(
    readerFontFamily,
  )}, ${getReaderCssFontStack(settings.fontChoice, settings.readingLanguage)}`;
  const courseAnswerLineHeight = Math.max(
    28,
    18 * settings.fontScale * settings.lineHeight,
  );
  const courseAnswerBaselineOffset = Math.round(17 * settings.fontScale * 1.28);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      :root {
        color-scheme: ${palette.blurTint === 'dark' ? 'dark' : 'light'};
      }
	      * {
	        box-sizing: border-box;
	      }
	      ${buildReaderFontFaceCss()}
      :root {
        --reader-font-family: ${readerFontStack};
        --reader-ui-font-family: ${cssString(typography.ui)};
      }
	      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        color: ${palette.foreground};
        font-family: var(--reader-font-family) !important;
        font-size: ${18 * settings.fontScale}px;
        line-height: ${settings.lineHeight * 18 * settings.fontScale}px;
        overflow: hidden;
        -webkit-text-size-adjust: 100%;
        -webkit-user-select: text;
        -webkit-touch-callout: ${
          Platform.OS === 'android' ? 'default' : 'none'
        };
        user-select: text;
        word-break: normal;
        overflow-wrap: anywhere;
      }
      body,
      .container,
      .heading,
      .paragraph,
      .quote-text,
      .footnote-text,
      .list-text,
      .char,
      a,
      .bible-ref {
        font-family: var(--reader-font-family) !important;
      }
      ::selection {
        background: ${selectionColor};
        color: ${selectionTextColor};
      }
      a {
        color: ${palette.primarySolid};
        text-decoration: underline;
      }
      .bible-ref {
        color: ${palette.foreground};
        cursor: pointer;
        text-decoration-line: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 0.18em;
        text-decoration-color: ${palette.primarySolid};
      }
      .container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .heading {
        font-weight: 700;
        margin: 0;
      }
      .heading-large {
        font-size: 21px;
        line-height: 28px;
        margin-top: 8px;
      }
      .heading-medium {
        font-size: 17px;
        line-height: 24px;
        margin-top: 6px;
      }
      .heading-small {
        font-size: 17px;
        line-height: 22px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: ${palette.mutedStrong};
        margin-top: 4px;
      }
      .paragraph,
      .quote-text,
      .footnote-text,
      .list-text {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
        max-width: 100%;
      }
      .quote-block {
        border-left: 4px solid ${palette.primaryContainer};
        padding-left: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .quote-text {
        color: ${palette.mutedStrong};
        font-size: ${17 * settings.fontScale}px;
        line-height: ${17 * settings.fontScale * settings.lineHeight}px;
        font-style: italic;
      }
      .list-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .list-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        min-width: 0;
        max-width: 100%;
      }
      .list-marker {
        color: ${palette.primarySolid};
        font-family: var(--reader-ui-font-family);
        font-weight: 700;
        margin-top: 2px;
      }
      .list-text {
        flex: 1;
        min-width: 0;
      }
      .divider {
        height: 1px;
        background: ${palette.outlineVariant};
        margin: 10px 0;
      }
      .footnote {
        border: 1px solid ${palette.outlineVariant};
        background: ${palette.surfaceLow};
        padding: 16px;
        border-radius: 14px;
      }
      .footnote-text {
        color: ${palette.mutedStrong};
        font-size: 14px;
        line-height: 22px;
        font-style: italic;
      }
      .image-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-decoration: none;
      }
      .image {
        width: 100%;
        height: auto;
        min-height: 220px;
        border-radius: 14px;
        background: ${palette.surfaceHigh};
      }
      .image-caption {
        color: ${palette.mutedStrong};
        font-family: var(--reader-ui-font-family);
        font-size: 12px;
      }
      .mark-strong {
        font-weight: 700;
      }
      .mark-em {
        font-style: italic;
      }
      .mark-u {
        text-decoration: underline;
      }
      .mark-small {
        font-size: 14px;
      }
      .bible-course-content .list-text .mark-strong,
      .bible-course-content .paragraph .mark-strong {
        font-weight: 800;
        font-size: ${19 * settings.fontScale}px;
        line-height: ${19 * settings.fontScale * settings.lineHeight}px;
      }
      .bible-course-content .list-row {
        padding: 14px;
        border: 1px solid ${palette.outlineVariant};
        border-radius: 14px;
        background: ${palette.surfaceLow};
      }
      .bible-course-content .list-marker {
        margin-top: 5px;
        font-size: ${18 * settings.fontScale}px;
      }
      .course-note-label {
        display: block;
        margin-top: 8px;
        margin-bottom: 0;
        font-family: var(--reader-ui-font-family) !important;
        font-size: ${14 * settings.fontScale}px;
        line-height: ${18 * settings.fontScale}px;
        font-weight: 800;
        color: ${palette.primarySolid};
        text-transform: uppercase;
      }
      .course-answer-wrap {
        display: block;
        margin: 6px 0 10px;
      }
      .course-answer-prefix {
        display: block;
        margin-bottom: 4px;
        color: ${palette.mutedStrong};
        font-family: var(--reader-ui-font-family) !important;
        font-size: ${14 * settings.fontScale}px;
        font-weight: 700;
      }
      .course-answer-input {
        display: block;
        width: 100%;
        min-height: ${Math.max(44, 34 * settings.fontScale)}px;
        border: 0;
        border-radius: 0;
        outline: none;
        resize: none;
        overflow: hidden;
        padding: 0 2px;
        color: ${palette.foreground};
        caret-color: ${palette.primarySolid};
        background-color: transparent;
        background-image: linear-gradient(
          to bottom,
          transparent calc(100% - 1px),
          ${palette.outline} calc(100% - 1px)
        );
        background-position: 0 ${courseAnswerBaselineOffset}px;
        background-size: 100% ${courseAnswerLineHeight}px;
        -webkit-appearance: none;
        appearance: none;
        font-family: var(--reader-font-family) !important;
        font-size: ${17 * settings.fontScale}px;
        line-height: ${courseAnswerLineHeight}px;
      }
      .course-answer-input::placeholder {
        color: ${palette.muted};
      }
      .verse-number {
        color: ${palette.primarySolid};
        font-size: 12px;
        line-height: 18px;
        font-weight: 700;
      }
      .char {
        display: inline;
        white-space: pre-wrap;
        -webkit-user-select: text;
        user-select: text;
      }
      .highlight-run {
        padding: 0.08em 0.08em 0.1em;
        margin: -0.04em -0.08em;
        border-radius: 0.05em;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      .highlight-run .bible-ref {
        color: inherit;
        text-decoration-color: currentColor;
      }
      .search-flash {
        animation: searchPulse 900ms ease-in-out 0s 3 alternate;
        background: ${searchHighlightColor};
        color: ${searchHighlightTextColor};
        border-radius: 0.12em;
        box-shadow: 0 0 0 0.12em ${searchHighlightColor};
      }
      @keyframes searchPulse {
        from {
          filter: brightness(1);
        }
        to {
          filter: brightness(1.18);
        }
      }
    </style>
  </head>
  <body>
    <div class="container${
      enableCourseAnswerFields ? ' bible-course-content' : ''
    }">${body}</div>
    <script>
      (function () {
        var documentKey = ${JSON.stringify(lessonSlug)};
        var searchTarget = ${JSON.stringify(searchTarget ?? null)};
        var readerFontFamily = ${JSON.stringify(readerFontFamily)};
        var readerFontStack = ${JSON.stringify(readerFontStack)};
        var searchTimer = null;
        var fontReadyPosted = false;

        function post(payload) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }

        function reportHeight() {
          var height = Math.ceil(
            Math.max(
              document.body.scrollHeight || 0,
              document.documentElement.scrollHeight || 0,
            ),
          );
          post({ type: 'height', height: height || 1 });
        }

        function reportSettledHeight() {
          var attempts = 0;
          function tick() {
            reportHeight();
            attempts += 1;
            if (attempts < 12) {
              window.setTimeout(tick, attempts < 5 ? 120 : 260);
            }
          }
          tick();
        }

        function setupCourseAnswers() {
          var answers = Array.prototype.slice.call(
            document.querySelectorAll('[data-course-answer-key]'),
          );

          answers.forEach(function (answer) {
            var storageKey =
              'course-answer:' +
              documentKey +
              ':' +
              answer.getAttribute('data-course-answer-key');
            try {
              answer.value = window.localStorage.getItem(storageKey) || '';
            } catch (error) {}

            function resizeAnswer() {
              answer.style.height = 'auto';
              answer.style.height =
                Math.max(answer.scrollHeight, answer.offsetHeight) + 'px';
              reportHeight();
            }

            answer.addEventListener('input', function () {
              try {
                window.localStorage.setItem(storageKey, answer.value);
              } catch (error) {}
              resizeAnswer();
            });
            answer.addEventListener('focus', function () {
              post({ type: 'selectionClear' });
            });
            window.setTimeout(resizeAnswer, 30);
          });
        }

        function forceReaderFont() {
          document.documentElement.style.setProperty(
            '--reader-font-family',
            readerFontStack,
          );
          document.body.style.setProperty(
            'font-family',
            readerFontStack,
            'important',
          );
          Array.prototype.forEach.call(
            document.querySelectorAll(
              'body, .container, .heading, .paragraph, .quote-text, .footnote-text, .list-text, .char, a, .bible-ref',
            ),
            function (node) {
              node.style.setProperty(
                'font-family',
                readerFontStack,
                'important',
              );
            },
          );
        }

        function postFontReady() {
          if (fontReadyPosted) {
            return;
          }
          fontReadyPosted = true;
          forceReaderFont();
          reportSettledHeight();
          post({ type: 'fontReady' });
        }

        function settleReaderFont() {
          forceReaderFont();
          if (document.fonts && document.fonts.load) {
            Promise.all([
              document.fonts.load('400 18px "' + readerFontFamily + '"'),
              document.fonts.load('700 18px "' + readerFontFamily + '"'),
              document.fonts.ready,
            ])
              .then(function () {
                window.requestAnimationFrame(function () {
                  window.setTimeout(postFontReady, 80);
                });
              })
              .catch(function () {
                window.setTimeout(postFontReady, 500);
              });
            window.setTimeout(postFontReady, 2200);
            return;
          }

          window.setTimeout(postFontReady, 900);
        }

        function clearSearchFlash() {
          window.clearTimeout(searchTimer);
          Array.prototype.forEach.call(
            document.querySelectorAll('.search-flash'),
            function (node) {
              node.classList.remove('search-flash');
            },
          );
        }

        function flashSearchTarget() {
          if (!searchTarget || !searchTarget.query || !searchTarget.query.trim()) {
            return;
          }

          var textNodes = Array.prototype.slice.call(
            document.querySelectorAll('[data-text-node="1"]'),
          );
          if (!textNodes.length) {
            return;
          }

          var query = searchTarget.query.trim().toLowerCase();
          var haystack = textNodes
            .map(function (node) {
              return node.textContent || '';
            })
            .join('')
            .toLowerCase();
          var start = haystack.indexOf(query);
          if (start < 0) {
            return;
          }

          var end = start + query.length;
          var offset = 0;
          var matched = textNodes.filter(function (node) {
            var text = node.textContent || '';
            var nextOffset = offset + text.length;
            var overlaps = nextOffset > start && offset < end;
            offset = nextOffset;
            return overlaps;
          });
          if (!matched.length) {
            return;
          }

          clearSearchFlash();
          matched.forEach(function (node) {
            node.classList.add('search-flash');
          });

          var rect = matched[0].getBoundingClientRect();
          post({ type: 'searchMatch', offsetY: Math.max(0, rect.top + window.pageYOffset) });
          searchTimer = window.setTimeout(clearSearchFlash, 3000);
        }

        window.__syncReaderHighlights = function (items) {
          var textNodes = Array.prototype.slice.call(
            document.querySelectorAll('[data-text-node="1"]'),
          );
          textNodes.forEach(function (node) {
            var characters = Array.from(node.textContent || '');
            var nodeStart = Number(node.getAttribute('data-start-index'));
            var nodeEnd = Number(node.getAttribute('data-end-index'));
            var matchingItems = (items || []).filter(function (item) {
              return item.startIndex <= nodeEnd && item.endIndex >= nodeStart;
            });

            node.textContent = '';
            if (!matchingItems.length) {
              node.textContent = characters.join('');
              return;
            }

            var boundaries = [0, characters.length];
            matchingItems.forEach(function (item) {
              boundaries.push(Math.max(0, item.startIndex - nodeStart));
              boundaries.push(Math.min(characters.length, item.endIndex - nodeStart + 1));
            });
            boundaries = boundaries.filter(function (value, index, values) {
              return value >= 0 && value <= characters.length && values.indexOf(value) === index;
            }).sort(function (left, right) { return left - right; });

            for (var boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex += 1) {
              var start = boundaries[boundaryIndex];
              var end = boundaries[boundaryIndex + 1];
              var segment = characters.slice(start, end).join('');
              var applicable = matchingItems.filter(function (item) {
                return item.startIndex <= nodeStart + start && item.endIndex >= nodeStart + end - 1;
              }).pop();

              if (!applicable) {
                node.appendChild(document.createTextNode(segment));
                continue;
              }

              var highlightNode = document.createElement('span');
              highlightNode.className = 'reader-highlighted';
              highlightNode.textContent = segment;
              if (applicable.backgroundColor) {
                highlightNode.style.backgroundColor = applicable.backgroundColor;
                highlightNode.style.color = applicable.textColor || '';
                highlightNode.style.borderRadius = '0.08em';
              }
              if (applicable.note || applicable.style === 'underline') {
                highlightNode.style.textDecorationLine = 'underline';
                highlightNode.style.textDecorationStyle = 'solid';
                highlightNode.style.textDecorationThickness = '1.4px';
                highlightNode.style.textUnderlineOffset = '0.18em';
                highlightNode.style.textDecorationColor = applicable.underlineColor || applicable.color || 'currentColor';
                highlightNode.style.cursor = applicable.note ? 'pointer' : '';
              }
              if (applicable.note) {
                highlightNode.setAttribute('data-highlight-id', applicable.id || '');
                highlightNode.setAttribute('data-highlight-text', applicable.text || '');
                highlightNode.setAttribute('data-highlight-color', applicable.color || '');
                highlightNode.setAttribute('data-highlight-created-at', applicable.createdAt || '');
                highlightNode.setAttribute('data-highlight-note', applicable.note || '');
              }
              node.appendChild(highlightNode);
            }
          });
          return true;
        };

        function getSelectionBoundaryIndex(container, offset) {
          var element = container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container;
          var textNode = element && element.closest
            ? element.closest('[data-text-node="1"]')
            : null;
          if (!textNode) {
            return null;
          }
          var prefixRange = document.createRange();
          prefixRange.selectNodeContents(textNode);
          try {
            prefixRange.setEnd(container, offset);
          } catch (error) {
            return null;
          }
          return Number(textNode.getAttribute('data-start-index')) + Array.from(prefixRange.toString()).length;
        }

        function reportSelection() {
          var selection = window.getSelection();
          if (!androidRange && (!selection || selection.rangeCount === 0 || selection.isCollapsed)) {
            post({ type: 'selectionClear' });
            return;
          }

          var range = androidRange || selection.getRangeAt(0);
          var startIndex = getSelectionBoundaryIndex(range.startContainer, range.startOffset);
          var endExclusive = getSelectionBoundaryIndex(range.endContainer, range.endOffset);
          var selectedText = range.toString();
          var leadingWhitespace = (selectedText.match(/^\\s*/) || [''])[0];
          var trailingWhitespace = (selectedText.match(/\\s*$/) || [''])[0];
          var text = androidRange ? selectedText : selectedText.replace(/\\s+/g, ' ').trim();

          if (startIndex === null || endExclusive === null || !text) {
            post({ type: 'selectionClear' });
            return;
          }

          if (!androidRange) {
            startIndex += Array.from(leadingWhitespace).length;
            endExclusive -= Array.from(trailingWhitespace).length;
          }
          var endIndex = endExclusive - 1;
          if (endIndex < startIndex) {
            post({ type: 'selectionClear' });
            return;
          }

          post({
            type: 'selection',
            selection: {
              id:
                startIndex === endIndex
                  ? documentKey + ':chars:' + startIndex
                  : documentKey + ':chars:' + startIndex + '-' + endIndex,
              paragraphKey: documentKey,
              startIndex: startIndex,
              endIndex: endIndex,
              text: text,
            },
          });
        }

        var androidRange = null;
        var selectionTimer = null;
        function queueSelectionReport(delay) {
          window.clearTimeout(selectionTimer);
          selectionTimer = window.setTimeout(reportSelection, delay || 80);
        }

        document.addEventListener('selectionchange', function () {
          if (!${Platform.OS === 'android'}) queueSelectionReport(${
    selectionDelays.selection
  });
        });
        document.addEventListener(
          'touchend',
          function () {
            if (!${Platform.OS === 'android'}) queueSelectionReport(${
    selectionDelays.touch
  });
          },
          { passive: true },
        );
        document.addEventListener('mouseup', function () {
          if (!${Platform.OS === 'android'}) queueSelectionReport(${
    selectionDelays.mouse
  });
        });
        document.addEventListener('contextmenu', function (event) {
          if (${Platform.OS === 'android' ? 'false' : 'true'}) {
            event.preventDefault();
          }
        });
        document.addEventListener('click', function (event) {
          var highlightNote = event.target.closest('[data-highlight-note]');
          if (highlightNote) {
            event.preventDefault();
            post({
              type: 'highlightNote',
              highlight: {
                id: highlightNote.getAttribute('data-highlight-id') || '',
                text: highlightNote.getAttribute('data-highlight-text') || '',
                color: highlightNote.getAttribute('data-highlight-color') || undefined,
                style: 'underline',
                note: highlightNote.getAttribute('data-highlight-note') || '',
                createdAt: highlightNote.getAttribute('data-highlight-created-at') || '',
              },
            });
            return;
          }

          var bibleReference = event.target.closest('[data-bible-reference]');
          if (bibleReference) {
            event.preventDefault();
            post({
              type: 'openBibleReference',
              reference: bibleReference.getAttribute('data-bible-reference'),
            });
            return;
          }

          var anchor = event.target.closest('a[href]');
          if (!anchor) {
            return;
          }
          event.preventDefault();
          post({ type: 'openLink', href: anchor.getAttribute('href') });
        });

        ${Platform.OS === 'android' ? androidReaderSelectionScript : ''}
        window.__clearReaderSelection = function () {
          if (typeof finishAndroidDrag === 'function') finishAndroidDrag();
          androidRange = null;
          if (typeof paintAndroidSelection === 'function') paintAndroidSelection();
          var selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
          }
          post({ type: 'selectionClear' });
          return true;
        };

        window.__reportReaderHeight = function () {
          reportSettledHeight();
          return true;
        };

        forceReaderFont();
        setupCourseAnswers();
        settleReaderFont();
        reportSettledHeight();
        window.setTimeout(flashSearchTarget, 120);
        window.addEventListener('load', reportSettledHeight);
        window.addEventListener('resize', reportSettledHeight);
        if (window.ResizeObserver) {
          new ResizeObserver(reportHeight).observe(document.body);
        }
      })();
      true;
    </script>
  </body>
</html>`;
}

function buildReaderFontFaceCss() {
  const fontFaces: Array<{
    family: string;
    fileName: string;
    uri: string;
    weight: number | string;
  }> = [
    ...readerFontAssets
      .filter(font => font.uri.length > 0)
      .map(font => ({
        family: font.family,
        fileName: font.fileName,
        uri: font.uri,
        weight:
          font.family === 'Menbere-Regular'
            ? '100 900'
            : font.family === 'NokiaPureHeadline-Bold' ||
              font.family.includes('Bold')
            ? 700
            : 400,
      })),
  ];

  return fontFaces
    .map(
      font => `@font-face {
        font-family: ${cssString(font.family)};
        src: ${buildFontFaceSrc(font.uri, font.fileName)};
        font-weight: ${font.weight};
        font-style: normal;
        font-display: block;
      }`,
    )
    .join('\n');
}

function buildFontFaceSrc(uri: string, fileName: string) {
  const sources = [
    uri,
    Platform.OS === 'android'
      ? `file:///android_asset/fonts/${fileName}`
      : fileName,
  ].filter(
    (source, index, allSources) =>
      source && allSources.indexOf(source) === index,
  );

  return sources
    .map(source => `url(${cssString(source)}) format('truetype')`)
    .join(', ');
}

function renderBlock({
  block,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
  enableCourseAnswerFields,
}: {
  block: Block;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
  enableCourseAnswerFields: boolean;
}) {
  switch (block.type) {
    case 'heading':
      return renderTextContainer({
        tagName: `h${block.level}` as 'h2' | 'h3' | 'h4',
        className: `heading ${getHeadingClass(block.level)}`,
        nodes: block.children,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      });
    case 'paragraph':
      return renderTextContainer({
        tagName: 'p',
        className: 'paragraph',
        nodes: block.children,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      });
    case 'blockquote':
      return `<div class="quote-block">${block.children
        .map(paragraph =>
          renderTextContainer({
            tagName: 'p',
            className: 'quote-text',
            nodes: paragraph.children,
            highlightRanges,
            palette,
            state,
            enableBibleReferences,
            enableCourseAnswerFields,
          }),
        )
        .join('')}</div>`;
    case 'list':
      return `<div class="list-block">${block.items
        .map(
          (item, itemIndex) => `<div class="list-row">
            <span class="list-marker">${
              block.ordered ? `${itemIndex + 1}.` : '•'
            }</span>
            ${renderTextContainer({
              tagName: 'div',
              className: 'list-text',
              nodes: item,
              highlightRanges,
              palette,
              state,
              enableBibleReferences,
              enableCourseAnswerFields,
            })}
          </div>`,
        )
        .join('')}</div>`;
    case 'divider':
      return '<div class="divider"></div>';
    case 'footnote':
      return `<div class="footnote">${renderTextContainer({
        tagName: 'p',
        className: 'footnote-text',
        nodes: block.children,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      })}</div>`;
    case 'image': {
      const uri = block.src.startsWith('http')
        ? block.src
        : `https://jacksequeira.org/${block.src.replace(/^\//, '')}`;
      return `<a class="image-wrap" href="${escapeAttribute(uri)}">
        <img class="image" src="${escapeAttribute(uri)}" alt="${escapeAttribute(
        block.alt ?? '',
      )}" />
        ${
          block.alt
            ? `<span class="image-caption">${escapeHtml(block.alt)}</span>`
            : ''
        }
      </a>`;
    }
  }
}

function renderTextContainer({
  tagName,
  className,
  nodes,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
  enableCourseAnswerFields,
}: {
  tagName: 'p' | 'div' | 'h2' | 'h3' | 'h4';
  className: string;
  nodes: Inline[];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
  enableCourseAnswerFields: boolean;
}) {
  const content = nodes
    .map(node =>
      renderInlineNode({
        node,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      }),
    )
    .join('');
  return `<${tagName} class="${className}">${content}</${tagName}>`;
}

function renderInlineNode({
  node,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
  enableCourseAnswerFields,
}: {
  node: Inline;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
  enableCourseAnswerFields: boolean;
}) {
  switch (node.type) {
    case 'text':
      return renderTextLeaf({
        value: node.value,
        marks: node.marks ?? [],
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      });
    case 'verseNumber':
      return renderVerseLeaf({
        node,
        highlightRanges,
        palette,
        state,
      });
    case 'link':
      return renderLinkNode({
        node,
        highlightRanges,
        palette,
        state,
        enableBibleReferences,
        enableCourseAnswerFields,
      });
  }
}

function renderTextLeaf({
  value,
  marks,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
  enableCourseAnswerFields,
}: {
  value: string;
  marks: TextInline['marks'];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
  enableCourseAnswerFields: boolean;
}) {
  if (enableCourseAnswerFields) {
    const answerField = renderCourseAnswerField({
      value,
      marks,
      highlightRanges,
      palette,
      state,
      enableBibleReferences,
    });
    if (answerField) {
      return answerField;
    }
  }

  if (enableBibleReferences) {
    return renderBibleReferenceAwareText({
      value,
      marks,
      highlightRanges,
      palette,
      state,
    });
  }

  const tokens = Array.from(value).map(character => {
    const charIndex = state.nextCharIndex++;
    return {
      charIndex,
      text: character,
      classNames: marksToClasses(marks),
      highlights: getHighlightsForChar(highlightRanges, charIndex),
    };
  });

  return renderCharacterTokens(tokens, palette);
}

function renderCourseAnswerField({
  value,
  marks,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
}: {
  value: string;
  marks: TextInline['marks'];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
}) {
  if (value.trim() === 'Note:') {
    return `<span class="course-note-label">${renderPlainCharacterSlice({
      value,
      marks,
      highlightRanges,
      palette,
      state,
    })}</span>`;
  }

  const match = value.match(/^(\s*(?:\d+\.\s*)?[^_]*?)_{5,}\s*$/);
  if (!match) {
    return null;
  }

  const answerKey = String(state.nextAnswerIndex++);
  const prefix = match[1].trim();
  const prefixHtml = prefix
    ? enableBibleReferences
      ? renderBibleReferenceAwareText({
          value: prefix,
          marks,
          highlightRanges,
          palette,
          state,
        })
      : renderPlainCharacterSlice({
          value: prefix,
          marks,
          highlightRanges,
          palette,
          state,
        })
    : '';
  const consumedLength = Array.from(value).length - Array.from(prefix).length;
  state.nextCharIndex += Math.max(0, consumedLength);

  return `<span class="course-answer-wrap">${
    prefixHtml ? `<span class="course-answer-prefix">${prefixHtml}</span>` : ''
  }<textarea class="course-answer-input" data-course-answer-key="${escapeAttribute(
    answerKey,
  )}" rows="1" placeholder="Write your answer here..."></textarea></span>`;
}

function renderBibleReferenceAwareText({
  value,
  marks,
  highlightRanges,
  palette,
  state,
}: {
  value: string;
  marks: TextInline['marks'];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
}) {
  const matches = findBibleReferences(value);
  if (matches.length === 0) {
    return renderPlainCharacterSlice({
      value,
      marks,
      highlightRanges,
      palette,
      state,
    });
  }

  let cursor = 0;
  const rendered: string[] = [];

  for (const match of matches) {
    if (match.start > cursor) {
      rendered.push(
        renderPlainCharacterSlice({
          value: value.slice(cursor, match.start),
          marks,
          highlightRanges,
          palette,
          state,
        }),
      );
    }

    const tokens = Array.from(value.slice(match.start, match.end)).map(
      character => {
        const charIndex = state.nextCharIndex++;
        return {
          charIndex,
          text: character,
          classNames: [...marksToClasses(marks), 'bible-ref'],
          highlights: getHighlightsForChar(highlightRanges, charIndex),
        };
      },
    );
    rendered.push(
      `<span data-bible-reference="${escapeAttribute(
        match.reference,
      )}">${renderCharacterTokens(tokens, palette)}</span>`,
    );
    cursor = match.end;
  }

  if (cursor < value.length) {
    rendered.push(
      renderPlainCharacterSlice({
        value: value.slice(cursor),
        marks,
        highlightRanges,
        palette,
        state,
      }),
    );
  }

  return rendered.join('');
}

function renderPlainCharacterSlice({
  value,
  marks,
  highlightRanges,
  palette,
  state,
}: {
  value: string;
  marks: TextInline['marks'];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
}) {
  const tokens = Array.from(value).map(character => {
    const charIndex = state.nextCharIndex++;
    return {
      charIndex,
      text: character,
      classNames: marksToClasses(marks),
      highlights: getHighlightsForChar(highlightRanges, charIndex),
    };
  });

  return renderCharacterTokens(tokens, palette);
}

function renderVerseLeaf({
  node,
  highlightRanges,
  palette,
  state,
}: {
  node: VerseNumberInline;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
}) {
  const tokens = Array.from(`${node.n} `).map(character => {
    const charIndex = state.nextCharIndex++;
    return {
      charIndex,
      text: character,
      classNames: ['verse-number'],
      highlights: getHighlightsForChar(highlightRanges, charIndex),
    };
  });

  return renderCharacterTokens(tokens, palette);
}

function renderLinkNode({
  node,
  highlightRanges,
  palette,
  state,
  enableBibleReferences,
  enableCourseAnswerFields,
}: {
  node: LinkInline;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
  enableBibleReferences: boolean;
  enableCourseAnswerFields: boolean;
}) {
  const content = node.children
    .map(child =>
      child.type === 'text'
        ? renderTextLeaf({
            value: child.value,
            marks: child.marks ?? [],
            highlightRanges,
            palette,
            state,
            enableBibleReferences,
            enableCourseAnswerFields,
          })
        : renderVerseLeaf({
            node: child,
            highlightRanges,
            palette,
            state,
          }),
    )
    .join('');

  return `<a href="${escapeAttribute(node.href)}">${content}</a>`;
}

function renderCharacterTokens(tokens: CharacterToken[], palette: AppPalette) {
  const runs: CharacterToken[][] = [];
  for (const token of tokens) {
    const previousRun = runs[runs.length - 1];
    const previousToken = previousRun?.[previousRun.length - 1];
    if (
      previousRun &&
      previousToken &&
      getTokenRunKey(previousToken) === getTokenRunKey(token)
    ) {
      previousRun.push(token);
    } else {
      runs.push([token]);
    }
  }

  return runs.map(run => renderCharacterRun(run, palette)).join('');
}

function renderCharacterRun(run: CharacterToken[], palette: AppPalette) {
  const firstToken = run[0];
  if (!firstToken) {
    return '';
  }

  const content = escapeHtml(run.map(token => token.text).join(''));
  const classes = firstToken.classNames.filter(Boolean).join(' ');
  const runClasses =
    firstToken.highlights.length > 0
      ? ['highlight-run', classes].filter(Boolean).join(' ')
      : classes;
  const styles = getTokenStyles(firstToken.highlights, palette);
  const attributes = getHighlightAttributes(firstToken.highlights);

  const startIndex = firstToken.charIndex;
  const endIndex = run[run.length - 1].charIndex;
  return `<span data-text-node="1" data-start-index="${startIndex}" data-end-index="${endIndex}" class="${runClasses}" style="${styles}"${attributes}>${content}</span>`;
}

function getHighlightAttributes(highlights: LessonHighlight[]) {
  const highlight = getNoteHighlight(highlights);
  if (!highlight?.note) {
    return '';
  }

  return ` data-highlight-id="${escapeAttribute(
    highlight.id,
  )}" data-highlight-text="${escapeAttribute(
    highlight.text,
  )}" data-highlight-color="${escapeAttribute(
    highlight.color ?? '',
  )}" data-highlight-created-at="${escapeAttribute(
    highlight.createdAt,
  )}" data-highlight-note="${escapeAttribute(highlight.note)}"`;
}

function getTokenRunKey(token: CharacterToken) {
  return [
    token.classNames.join('|'),
    token.highlights
      .map(
        highlight =>
          `${highlight.id}|${highlight.color ?? ''}|${highlight.style ?? ''}|${
            highlight.note ? 'note' : ''
          }`,
      )
      .join('||'),
  ].join('::');
}

function getTokenStyles(highlights: LessonHighlight[], palette: AppPalette) {
  if (highlights.length === 0) {
    return '';
  }

  const backgroundHighlight = getBackgroundHighlight(highlights);
  const noteHighlight = getNoteHighlight(highlights);
  const styles: string[] = [];

  if (backgroundHighlight) {
    const backgroundColor = backgroundHighlight.color ?? palette.highlight;
    const color = getContrastingTextColor(
      backgroundColor,
      palette.blurTint === 'dark',
    );
    styles.push(`background-color: ${backgroundColor}`, `color: ${color}`);
  }

  if (noteHighlight) {
    const underlineColor = backgroundHighlight
      ? getContrastingTextColor(
          backgroundHighlight.color ?? palette.highlight,
          palette.blurTint === 'dark',
        )
      : noteHighlight.color ?? palette.primarySolid;
    styles.push(
      'text-decoration-line: underline',
      'text-decoration-style: solid',
      'text-decoration-thickness: 1.4px',
      'text-underline-offset: 0.18em',
      `text-decoration-color: ${underlineColor}`,
      'cursor: pointer',
    );
  }

  return styles.map(style => `${style};`).join(' ');
}

function buildHighlightSyncItems({
  blocks,
  lessonSlug,
  highlights,
  palette,
}: {
  blocks: Block[];
  lessonSlug: string;
  highlights: LessonHighlight[];
  palette: AppPalette;
}): HighlightSyncItem[] {
  const ranges = buildHighlightRanges(
    highlights,
    lessonSlug,
    collectParagraphs(blocks, lessonSlug),
  );

  return ranges.map(({ startIndex, endIndex, highlight }) => {
    const backgroundHighlight =
      highlight.style === 'highlight' ||
      (highlight.note && highlight.style !== 'underline')
        ? highlight
        : null;
    const backgroundColor = backgroundHighlight
      ? backgroundHighlight.color ?? palette.highlight
      : undefined;
    const textColor = backgroundColor
      ? getContrastingTextColor(backgroundColor, palette.blurTint === 'dark')
      : undefined;
    const underlineColor =
      highlight.note || highlight.style === 'underline'
        ? backgroundColor
          ? getContrastingTextColor(
              backgroundColor,
              palette.blurTint === 'dark',
            )
          : highlight.color ?? palette.primarySolid
        : undefined;

    return {
      id: highlight.id,
      text: highlight.text,
      startIndex,
      endIndex,
      color: highlight.color,
      style: highlight.style,
      note: highlight.note,
      createdAt: highlight.createdAt,
      backgroundColor,
      textColor,
      underlineColor,
    };
  });
}

function getBackgroundHighlight(highlights: LessonHighlight[]) {
  return (
    highlights.find(highlight => highlight.style === 'highlight') ??
    highlights.find(
      highlight => highlight.note && highlight.style !== 'underline',
    )
  );
}

function getNoteHighlight(highlights: LessonHighlight[]) {
  return highlights.find(highlight => highlight.note);
}

function marksToClasses(marks: TextInline['marks']) {
  return (marks ?? []).map(mark => `mark-${mark}`);
}

function findBibleReferences(value: string) {
  const englishBookPattern =
    '(?:[1-3]\\s*)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\\s+of\\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)';
  const amharicBookPattern =
    '(?:[1-3]\\s*)?(?:ዘፍጥረት|ዘፀአት|ዘሌዋውያን|ዘኍልቍ|ዘዳግም|ኢያሱ|መሳፍንት|ሩት|ሳሙኤል|ነገሥት|ዜና\\s+መዋዕል|ዕዝራ|ነህምያ|አስቴር|ኢዮብ|መዝሙር|ምሳሌ|መክብብ|መኃልየ|ኢሳይያስ|ኤርምያስ|ሰቆቃወ|ሕዝቅኤል|ዳንኤል|ሆሴዕ|ኢዩኤል|አሞጽ|አብድዩ|ዮናስ|ሚክያስ|ናሆም|ዕንባቆም|ሶፎንያስ|ሐጌ|ዘካርያስ|ሚልክያስ|ማቴዎስ|ማርቆስ|ሉቃስ|ዮሐንስ|ሐዋርያት|ሮሜ|ቆሮንቶስ|ገላትያ|ኤፌሶን|ፊልጵስዩስ|ቆላስይስ|ተሰሎንቄ|ጢሞቴዎስ|ቲቶ|ፊልሞና|ዕብራውያን|ያዕቆብ|ጴጥሮስ|ይሁዳ|ራእይ)';
  const bookPattern = `(?:${englishBookPattern}|${amharicBookPattern})`;
  const referencePattern = new RegExp(
    `${bookPattern}\\s+\\d{1,3}:\\d{1,3}(?:[-–]\\d{1,3})?`,
    'gi',
  );
  const matches: Array<{ start: number; end: number; reference: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = referencePattern.exec(value))) {
    const reference = match[0].replace(/\s+/g, ' ').replace('–', '-').trim();
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      reference,
    });
  }

  return matches;
}

function collectParagraphs(blocks: Block[], lessonSlug: string) {
  const paragraphs: ParagraphMeta[] = [];
  let nextCharIndex = 0;

  function pushParagraph(paragraphKey: string, nodes: Inline[]) {
    const text = nodes.map(inlineToPlainText).join('');
    const startCharIndex = nextCharIndex;
    const endCharIndex = startCharIndex + Math.max(0, text.length - 1);
    paragraphs.push({
      paragraphKey,
      text,
      startCharIndex,
      endCharIndex,
    });
    nextCharIndex += text.length;
  }

  blocks.forEach((block, blockIndex) => {
    switch (block.type) {
      case 'heading':
        pushParagraph(
          buildParagraphKey(lessonSlug, blockIndex),
          block.children,
        );
        return;
      case 'paragraph':
        pushParagraph(
          buildParagraphKey(lessonSlug, blockIndex),
          block.children,
        );
        return;
      case 'blockquote':
        block.children.forEach((paragraph, childIndex) => {
          pushParagraph(
            buildParagraphKey(lessonSlug, blockIndex, childIndex),
            paragraph.children,
          );
        });
        return;
      case 'list':
        block.items.forEach((item, itemIndex) => {
          pushParagraph(
            buildParagraphKey(lessonSlug, blockIndex, itemIndex),
            item,
          );
        });
        return;
      case 'footnote':
        pushParagraph(
          buildParagraphKey(lessonSlug, blockIndex),
          block.children,
        );
        return;
      case 'divider':
      case 'image':
        return;
    }
  });

  return paragraphs;
}

function buildParagraphKey(
  lessonSlug: string,
  blockIndex: number,
  childIndex?: number,
) {
  return [lessonSlug, blockIndex, childIndex ?? 'root'].join(':');
}

function getHeadingClass(level: 2 | 3 | 4) {
  switch (level) {
    case 2:
      return 'heading-large';
    case 3:
      return 'heading-medium';
    case 4:
      return 'heading-small';
  }
}

function getHighlightsForChar(ranges: HighlightRange[], charIndex: number) {
  return ranges
    .filter(
      range => charIndex >= range.startIndex && charIndex <= range.endIndex,
    )
    .map(range => range.highlight);
}

function buildHighlightRanges(
  highlights: LessonHighlight[],
  documentKey: string,
  paragraphs: ParagraphMeta[],
) {
  const paragraphMap = new Map(
    paragraphs.map(item => [item.paragraphKey, item]),
  );

  return highlights
    .map(highlight => {
      const parsed = parseHighlightId(highlight.id);
      if (!parsed) {
        return null;
      }

      if (parsed.mode === 'chars') {
        if (parsed.scopeKey === documentKey) {
          return {
            startIndex: parsed.startIndex,
            endIndex: parsed.endIndex,
            highlight,
          };
        }

        const paragraph = paragraphMap.get(parsed.scopeKey);
        if (!paragraph) {
          return null;
        }

        return {
          startIndex: paragraph.startCharIndex + parsed.startIndex,
          endIndex: paragraph.startCharIndex + parsed.endIndex,
          highlight,
        };
      }

      const paragraph = paragraphMap.get(parsed.scopeKey);
      if (!paragraph) {
        return null;
      }

      const localRange = convertLegacyTokenRangeToCharacterRange(
        paragraph.text,
        parsed.startIndex,
        parsed.endIndex,
      );

      if (!localRange) {
        return null;
      }

      return {
        startIndex: paragraph.startCharIndex + localRange.startIndex,
        endIndex: paragraph.startCharIndex + localRange.endIndex,
        highlight,
      };
    })
    .filter(Boolean) as HighlightRange[];
}

function parseHighlightId(id: string) {
  const pieces = id.split(':');
  const rangeToken = pieces.pop();
  if (!rangeToken) {
    return null;
  }

  const charsMarkerIndex = pieces.lastIndexOf('chars');
  const rangeMatch = rangeToken.match(/^(\d+)(?:-(\d+))?$/);
  if (!rangeMatch) {
    return null;
  }

  const startIndex = Number(rangeMatch[1]);
  const endIndex = Number(rangeMatch[2] ?? rangeMatch[1]);
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
    return null;
  }

  if (charsMarkerIndex >= 0) {
    return {
      mode: 'chars' as const,
      scopeKey: pieces.slice(0, charsMarkerIndex).join(':'),
      startIndex,
      endIndex,
    };
  }

  return {
    mode: 'tokens' as const,
    scopeKey: pieces.join(':'),
    startIndex,
    endIndex,
  };
}

function convertLegacyTokenRangeToCharacterRange(
  plainText: string,
  startTokenIndex: number,
  endTokenIndex: number,
) {
  const parts = plainText.match(/\s+|[^\s]+/g) ?? [plainText];
  let charCursor = 0;
  let selectableIndex = 0;
  let startIndex: number | null = null;
  let endIndex: number | null = null;

  for (const part of parts) {
    const isSelectable = /[A-Za-z0-9]/.test(part);
    if (isSelectable) {
      if (selectableIndex === startTokenIndex) {
        startIndex = charCursor;
      }
      if (selectableIndex === endTokenIndex) {
        endIndex = charCursor + part.length - 1;
      }
      selectableIndex += 1;
    }
    charCursor += part.length;
  }

  if (startIndex == null || endIndex == null) {
    return null;
  }

  return { startIndex, endIndex };
}

function inlineToPlainText(inline: Inline): string {
  switch (inline.type) {
    case 'text':
      return inline.value;
    case 'verseNumber':
      return `${inline.n} `;
    case 'link':
      return inline.children.map(child => inlineToPlainText(child)).join('');
  }
}

function getContrastingTextColor(backgroundColor: string, darkTheme: boolean) {
  const rgb = parseRgb(backgroundColor);
  if (!rgb) {
    return darkTheme ? '#1d1610' : '#18222f';
  }

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.62 ? '#1d1610' : '#fffaf0';
}

function parseRgb(color: string) {
  const hex = color.trim().match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (hex) {
    const normalized =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map(char => `${char}${char}`)
            .join('')
        : hex[1];

    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  const rgba = color
    .trim()
    .match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
    };
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function cssString(value: string) {
  return JSON.stringify(value);
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  webViewHidden: {
    opacity: 0,
  },
  webViewContainer: {
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    elevation: 2,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
