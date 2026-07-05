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
    family: 'Cabin-Regular',
    uri: resolveFontAssetUri(
      'Cabin-Regular.ttf',
      require('../assets/fonts/Cabin-Regular.ttf'),
    ),
  },
  {
    family: 'cabin',
    uri: resolveFontAssetUri(
      'Cabin-Regular.ttf',
      require('../assets/fonts/Cabin-Regular.ttf'),
    ),
  },
  {
    family: 'Cabin_Condensed-Regular',
    uri: resolveFontAssetUri(
      'Cabin_Condensed-Regular.ttf',
      require('../assets/fonts/Cabin_Condensed-Regular.ttf'),
    ),
  },
  {
    family: 'cabin_condensed',
    uri: resolveFontAssetUri(
      'Cabin_Condensed-Regular.ttf',
      require('../assets/fonts/Cabin_Condensed-Regular.ttf'),
    ),
  },
  {
    family: 'Cabin_SemiCondensed-Regular',
    uri: resolveFontAssetUri(
      'Cabin_SemiCondensed-Regular.ttf',
      require('../assets/fonts/Cabin_SemiCondensed-Regular.ttf'),
    ),
  },
  {
    family: 'cabin_semicondensed',
    uri: resolveFontAssetUri(
      'Cabin_SemiCondensed-Regular.ttf',
      require('../assets/fonts/Cabin_SemiCondensed-Regular.ttf'),
    ),
  },
  {
    family: 'Lexend-Regular',
    uri: resolveFontAssetUri(
      'Lexend-Regular.ttf',
      require('../assets/fonts/Lexend-Regular.ttf'),
    ),
  },
  {
    family: 'lexend',
    uri: resolveFontAssetUri(
      'Lexend-Regular.ttf',
      require('../assets/fonts/Lexend-Regular.ttf'),
    ),
  },
  {
    family: 'Quicksand-Regular',
    uri: resolveFontAssetUri(
      'Quicksand-Regular.ttf',
      require('../assets/fonts/Quicksand-Regular.ttf'),
    ),
  },
  {
    family: 'quicksand',
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

type RenderState = {
  nextCharIndex: number;
};

type CharacterToken = {
  charIndex: number;
  text: string;
  classNames: string[];
  highlight?: LessonHighlight;
};

export function BlockContent({
  blocks,
  settings,
  lessonSlug,
  highlights,
  activeSelection,
  palette,
  typography,
  onSelectText,
  onOpenLink,
}: {
  blocks: Block[];
  settings: ReaderSettings;
  lessonSlug: string;
  highlights: LessonHighlight[];
  activeSelection?: TextSelection | null;
  palette: AppPalette;
  typography: AppTypography;
  onSelectText: (selection: TextSelection | null) => void;
  onOpenLink: (href: string) => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const previousSelectionRef = useRef<TextSelection | null>(null);
  const [contentHeight, setContentHeight] = useState(1);

  const html = useMemo(
    () =>
      buildLessonHtml({
        blocks,
        settings,
        lessonSlug,
        highlights,
        palette,
        typography,
      }),
    [blocks, settings, lessonSlug, highlights, palette, typography],
  );

  useEffect(() => {
    if (previousSelectionRef.current && !activeSelection) {
      webViewRef.current?.injectJavaScript(
        'window.__clearReaderSelection && window.__clearReaderSelection(); true;',
      );
    }
    previousSelectionRef.current = activeSelection ?? null;
  }, [activeSelection]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as
        | { type: 'height'; height: number }
        | { type: 'selection'; selection: TextSelection }
        | { type: 'selectionClear' }
        | { type: 'openLink'; href: string };

      switch (payload.type) {
        case 'height':
          if (payload.height > 0) {
            setContentHeight(current =>
              Math.abs(current - payload.height) > 1 ? payload.height : current,
            );
          }
          return;
        case 'selection':
          onSelectText(payload.selection);
          return;
        case 'selectionClear':
          onSelectText(null);
          return;
        case 'openLink':
          onOpenLink(payload.href);
          return;
      }
    } catch {
      // Ignore malformed bridge messages from the embedded page.
    }
  }

  return (
    <View style={[styles.container, { height: Math.max(1, contentHeight) }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        javaScriptEnabled
        domStorageEnabled={false}
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
}: {
  blocks: Block[];
  settings: ReaderSettings;
  lessonSlug: string;
  highlights: LessonHighlight[];
  palette: AppPalette;
  typography: AppTypography;
}) {
  const selectionDelays =
    Platform.OS === 'android'
      ? {selection: 45, touch: 25, mouse: 20}
      : {selection: 80, touch: 45, mouse: 30};
  const paragraphs = collectParagraphs(blocks, lessonSlug);
  const highlightRanges = buildHighlightRanges(
    highlights,
    lessonSlug,
    paragraphs,
  );
  const state: RenderState = { nextCharIndex: 0 };
  const body = blocks
    .map(block =>
      renderBlock({
        block,
        highlightRanges,
        palette,
        state,
      }),
    )
    .join('');

  const selectionColor = palette.primaryContainer;
  const selectionTextColor = getContrastingTextColor(
    selectionColor,
    palette.blurTint === 'dark',
  );

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
	      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        color: ${palette.foreground};
        font-family: ${getReaderCssFontStack(
          settings.fontChoice,
          settings.readingLanguage,
        )};
        font-size: ${18 * settings.fontScale}px;
        line-height: ${18 * settings.fontScale * settings.lineHeight}px;
        overflow: hidden;
        -webkit-text-size-adjust: 100%;
        -webkit-user-select: text;
        -webkit-touch-callout: default;
        user-select: text;
        word-break: normal;
      }
      ::selection {
        background: ${selectionColor};
        color: ${selectionTextColor};
      }
      a {
        color: ${palette.primarySolid};
        text-decoration: underline;
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
        font-size: 31px;
        line-height: 36px;
        margin-top: 8px;
      }
      .heading-medium {
        font-size: 25px;
        line-height: 30px;
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
      }
      .list-marker {
        color: ${palette.primarySolid};
        font-family: ${cssString(typography.ui)};
        font-weight: 700;
        margin-top: 2px;
      }
      .list-text {
        flex: 1;
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
        font-family: ${cssString(typography.ui)};
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
      .verse-number {
        color: ${palette.primarySolid};
        font-size: 12px;
        line-height: 18px;
        font-weight: 700;
      }
      .char {
        display: inline;
        position: relative;
        white-space: pre-wrap;
        -webkit-user-select: text;
        user-select: text;
      }
      .highlight-run {
        padding: 0 0.08em;
        margin: 0 -0.08em;
        border-radius: 0.05em;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
    </style>
  </head>
  <body>
    <div class="container">${body}</div>
    <script>
      (function () {
        var documentKey = ${JSON.stringify(lessonSlug)};

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

        function reportSelection() {
          var selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            post({ type: 'selectionClear' });
            return;
          }

          var range = selection.getRangeAt(0);
          var chars = Array.prototype.slice
            .call(document.querySelectorAll('[data-char="1"]'))
            .filter(function (charNode) {
              try {
                return range.intersectsNode(charNode);
              } catch (error) {
                return false;
              }
            });

          if (!chars.length) {
            post({ type: 'selectionClear' });
            return;
          }

          var startIndex = Number(chars[0].getAttribute('data-index'));
          var endIndex = Number(chars[chars.length - 1].getAttribute('data-index'));
          var text = selection.toString().replace(/\\s+/g, ' ').trim();

          if (!text) {
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

        var selectionTimer = null;
        function queueSelectionReport(delay) {
          window.clearTimeout(selectionTimer);
          selectionTimer = window.setTimeout(reportSelection, delay || 80);
        }

        document.addEventListener('selectionchange', function () {
          queueSelectionReport(${selectionDelays.selection});
        });
        document.addEventListener(
          'touchend',
          function () {
            queueSelectionReport(${selectionDelays.touch});
          },
          { passive: true },
        );
        document.addEventListener('mouseup', function () {
          queueSelectionReport(${selectionDelays.mouse});
        });
        document.addEventListener('click', function (event) {
          var anchor = event.target.closest('a[href]');
          if (!anchor) {
            return;
          }
          event.preventDefault();
          post({ type: 'openLink', href: anchor.getAttribute('href') });
        });

        window.__clearReaderSelection = function () {
          var selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
          }
          post({ type: 'selectionClear' });
          return true;
        };

        reportHeight();
        window.addEventListener('load', reportHeight);
        window.addEventListener('resize', reportHeight);
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
  return readerFontAssets
    .filter(font => font.uri.length > 0)
    .map(
      font => `@font-face {
        font-family: ${cssString(font.family)};
        src: url(${cssString(font.uri)}) format('truetype');
        font-weight: 400;
        font-style: normal;
      }`,
    )
    .join('\n');
}

function renderBlock({
  block,
  highlightRanges,
  palette,
  state,
}: {
  block: Block;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
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
      });
    case 'paragraph':
      return renderTextContainer({
        tagName: 'p',
        className: 'paragraph',
        nodes: block.children,
        highlightRanges,
        palette,
        state,
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
}: {
  tagName: 'p' | 'div' | 'h2' | 'h3' | 'h4';
  className: string;
  nodes: Inline[];
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
}) {
  const content = nodes
    .map(node =>
      renderInlineNode({
        node,
        highlightRanges,
        palette,
        state,
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
}: {
  node: Inline;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
}) {
  switch (node.type) {
    case 'text':
      return renderTextLeaf({
        value: node.value,
        marks: node.marks ?? [],
        highlightRanges,
        palette,
        state,
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
      });
  }
}

function renderTextLeaf({
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
        highlight: getHighlightForChar(highlightRanges, charIndex),
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
        highlight: getHighlightForChar(highlightRanges, charIndex),
      };
    });

  return renderCharacterTokens(tokens, palette);
}

function renderLinkNode({
  node,
  highlightRanges,
  palette,
  state,
}: {
  node: LinkInline;
  highlightRanges: HighlightRange[];
  palette: AppPalette;
  state: RenderState;
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

  const content = run.map(renderCharacterSpan).join('');
  const classes = firstToken.classNames.filter(Boolean).join(' ');
  const runClasses = firstToken.highlight
    ? ['highlight-run', classes].filter(Boolean).join(' ')
    : classes;
  const styles = getTokenStyles(firstToken.highlight, palette);

  if (!runClasses && !styles) {
    return content;
  }

  return `<span class="${runClasses}" style="${styles}">${content}</span>`;
}

function renderCharacterSpan({ charIndex, text, classNames }: CharacterToken) {
  const classes = ['char', ...classNames].filter(Boolean).join(' ');
  const displayText = escapeHtml(text);

  return `<span data-char="1" data-index="${charIndex}" class="${classes}">${displayText}</span>`;
}

function getTokenRunKey(token: CharacterToken) {
  return [
    token.classNames.join('|'),
    token.highlight?.id ?? '',
    token.highlight?.color ?? '',
    token.highlight?.style ?? '',
  ].join('::');
}

function getTokenStyles(
  highlight: LessonHighlight | undefined,
  palette: AppPalette,
) {
  if (!highlight) {
    return '';
  }

  if (highlight.style === 'underline') {
    return `text-decoration: underline; text-decoration-style: solid; text-decoration-color: ${
      highlight.color ?? palette.primarySolid
    };`;
  }

  const backgroundColor = highlight.color ?? palette.highlight;
  const color = getContrastingTextColor(
    backgroundColor,
    palette.blurTint === 'dark',
  );
  return `background-color: ${backgroundColor}; color: ${color};`;
}

function marksToClasses(marks: TextInline['marks']) {
  return (marks ?? []).map(mark => `mark-${mark}`);
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

function getHighlightForChar(ranges: HighlightRange[], charIndex: number) {
  return ranges.find(
    range => charIndex >= range.startIndex && charIndex <= range.endIndex,
  )?.highlight;
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
  },
  webView: {
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    backgroundColor: 'transparent',
  },
});
