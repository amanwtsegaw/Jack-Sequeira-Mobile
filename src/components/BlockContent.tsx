import React from 'react';
import {Image, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import type {
  Block,
  Inline,
  LinkInline,
  TextInline,
  VerseNumberInline,
} from '../content/schema';
import type {AppPalette, AppTypography} from '../design';
import {theme} from '../theme';
import type {LessonHighlight, ReaderSettings} from '../storage';

export function BlockContent({
  blocks,
  settings,
  lessonSlug,
  highlights,
  selectionMode,
  palette,
  typography,
  onToggleHighlight,
  onOpenLink,
}: {
  blocks: Block[];
  settings: ReaderSettings;
  lessonSlug: string;
  highlights: LessonHighlight[];
  selectionMode: boolean;
  palette: AppPalette;
  typography: AppTypography;
  onToggleHighlight: (highlight: {id: string; text: string}) => void;
  onOpenLink: (href: string) => void;
}) {
  const styles = createStyles(palette, typography);
  const highlightMap = new Map(highlights.map(item => [item.id, item]));

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Text
                key={index}
                style={[
                  styles.heading,
                  block.level === 2 && styles.headingLarge,
                  block.level === 3 && styles.headingMedium,
                  block.level === 4 && styles.headingSmall,
                ]}>
                {block.children.map(node => node.value).join('')}
              </Text>
            );
          case 'paragraph':
            return (
              <SelectableParagraph
                key={index}
                lessonSlug={lessonSlug}
                blockIndex={index}
                style={[
                  styles.paragraph,
                  {
                    fontSize: 18 * settings.fontScale,
                    lineHeight: 18 * settings.fontScale * settings.lineHeight,
                  },
                ]}
                styles={styles}
                nodes={block.children}
                selectionMode={selectionMode}
                highlightMap={highlightMap}
                onToggleHighlight={onToggleHighlight}
                onOpenLink={onOpenLink}
              />
            );
          case 'blockquote':
            return (
              <View key={index} style={styles.quoteBlock}>
                {block.children.map((paragraph, childIndex) => (
                  <SelectableParagraph
                    key={childIndex}
                    style={[
                      styles.quoteText,
                      {
                        fontSize: 17 * settings.fontScale,
                        lineHeight: 17 * settings.fontScale * settings.lineHeight,
                      },
                    ]}
                    styles={styles}
                    lessonSlug={lessonSlug}
                    blockIndex={index}
                    childIndex={childIndex}
                    nodes={paragraph.children}
                    selectionMode={selectionMode}
                    highlightMap={highlightMap}
                    onToggleHighlight={onToggleHighlight}
                    onOpenLink={onOpenLink}
                  />
                ))}
              </View>
            );
          case 'list':
            return (
              <View key={index} style={styles.listBlock}>
                {block.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.listRow}>
                    <Text style={styles.listMarker}>
                      {block.ordered ? `${itemIndex + 1}.` : '•'}
                    </Text>
                    <SelectableParagraph
                      style={[
                        styles.listText,
                        {
                          fontSize: 18 * settings.fontScale,
                          lineHeight: 18 * settings.fontScale * settings.lineHeight,
                        },
                      ]}
                      styles={styles}
                      lessonSlug={lessonSlug}
                      blockIndex={index}
                      childIndex={itemIndex}
                      nodes={item}
                      selectionMode={selectionMode}
                      highlightMap={highlightMap}
                      onToggleHighlight={onToggleHighlight}
                      onOpenLink={onOpenLink}
                    />
                  </View>
                ))}
              </View>
            );
          case 'divider':
            return <View key={index} style={styles.divider} />;
          case 'footnote':
            return (
              <View key={index} style={styles.footnote}>
                <Text style={styles.footnoteText}>
                  <InlineText nodes={block.children} styles={styles} onOpenLink={onOpenLink} />
                </Text>
              </View>
            );
          case 'image': {
            const uri = block.src.startsWith('http')
              ? block.src
              : `https://jacksequeira.org/${block.src.replace(/^\//, '')}`;
            return (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(uri).catch(() => undefined)}
                style={styles.imageWrap}>
                <Image source={{uri}} style={styles.image} />
                {block.alt ? <Text style={styles.imageCaption}>{block.alt}</Text> : null}
              </Pressable>
            );
          }
          default:
            return null;
        }
      })}
    </View>
  );
}

function SelectableParagraph({
  style,
  styles,
  lessonSlug,
  blockIndex,
  childIndex,
  nodes,
  selectionMode,
  highlightMap,
  onToggleHighlight,
  onOpenLink,
}: {
  style: object;
  styles: ReturnType<typeof createStyles>;
  lessonSlug: string;
  blockIndex: number;
  childIndex?: number;
  nodes: Inline[];
  selectionMode: boolean;
  highlightMap: Map<string, LessonHighlight>;
  onToggleHighlight: (highlight: {id: string; text: string}) => void;
  onOpenLink: (href: string) => void;
}) {
  const selectableParts = getSelectableParts(nodes);
  const hasHighlights = selectableParts.some(part =>
    highlightMap.has(buildHighlightId(lessonSlug, blockIndex, childIndex, part.index)),
  );

  if (selectionMode || hasHighlights) {
    return (
      <Text style={style}>
        {selectableParts.map(part => {
          const id = buildHighlightId(lessonSlug, blockIndex, childIndex, part.index);
          const isHighlighted = highlightMap.has(id);
          return (
            <Text
              key={id}
              onPress={() => onToggleHighlight({id, text: part.text.trim()})}
              style={isHighlighted ? styles.highlightedText : undefined}>
              {part.text}
            </Text>
          );
        })}
      </Text>
    );
  }

  return (
    <Text style={style}>
      <InlineText nodes={nodes} styles={styles} onOpenLink={onOpenLink} />
    </Text>
  );
}

function InlineText({
  nodes,
  styles,
  onOpenLink,
}: {
  nodes: Inline[];
  styles: ReturnType<typeof createStyles>;
  onOpenLink: (href: string) => void;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'text') {
          return <StyledText key={index} node={node} styles={styles} />;
        }
        if (node.type === 'verseNumber') {
          return <VerseNumber key={index} node={node} styles={styles} />;
        }
        return <InlineLink key={index} node={node} styles={styles} onOpenLink={onOpenLink} />;
      })}
    </>
  );
}

function StyledText({
  node,
  styles,
}: {
  node: TextInline;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Text
      style={[
        node.marks?.includes('strong') && styles.strong,
        node.marks?.includes('em') && styles.emphasis,
        node.marks?.includes('u') && styles.underline,
        node.marks?.includes('small') && styles.small,
      ]}>
      {node.value}
    </Text>
  );
}

function VerseNumber({
  node,
  styles,
}: {
  node: VerseNumberInline;
  styles: ReturnType<typeof createStyles>;
}) {
  return <Text style={styles.verseNumber}>{node.n}</Text>;
}

function InlineLink({
  node,
  styles,
  onOpenLink,
}: {
  node: LinkInline;
  styles: ReturnType<typeof createStyles>;
  onOpenLink: (href: string) => void;
}) {
  return (
    <Text style={styles.link} onPress={() => onOpenLink(node.href)}>
      <InlineText nodes={node.children} styles={styles} onOpenLink={onOpenLink} />
    </Text>
  );
}

function getSelectableParts(nodes: Inline[]) {
  const text = nodes.map(inlineToPlainText).join('');
  const chunks = text.match(/[^.!?]+[.!?]?\s*|\s+/g) ?? [text];
  return chunks
    .map((part, index) => ({index, text: part}))
    .filter(part => part.text.length > 0);
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

function buildHighlightId(
  lessonSlug: string,
  blockIndex: number,
  childIndex: number | undefined,
  partIndex: number,
) {
  return [lessonSlug, blockIndex, childIndex ?? 'root', partIndex].join(':');
}

function createStyles(palette: AppPalette, typography: AppTypography) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    heading: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontWeight: '700',
    },
    headingLarge: {
      fontSize: 31,
      lineHeight: 36,
      marginTop: 8,
    },
    headingMedium: {
      fontSize: 25,
      lineHeight: 30,
      marginTop: 6,
    },
    headingSmall: {
      fontSize: 17,
      lineHeight: 22,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: palette.mutedStrong,
      marginTop: 4,
    },
    paragraph: {
      color: palette.foreground,
      fontFamily: typography.reading,
    },
    quoteBlock: {
      borderLeftWidth: 4,
      borderLeftColor: palette.primaryContainer,
      paddingLeft: 14,
      gap: 8,
    },
    quoteText: {
      color: palette.mutedStrong,
      fontFamily: typography.reading,
      fontStyle: 'italic',
    },
    listBlock: {
      gap: 8,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    listMarker: {
      color: palette.primarySolid,
      fontFamily: typography.ui,
      fontWeight: '700',
      marginTop: 2,
    },
    listText: {
      flex: 1,
      color: palette.foreground,
      fontFamily: typography.reading,
    },
    divider: {
      height: 1,
      backgroundColor: palette.outlineVariant,
      marginVertical: 10,
    },
    footnote: {
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceLow,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    footnoteText: {
      color: palette.mutedStrong,
      fontFamily: typography.reading,
      fontSize: 14,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    imageWrap: {
      gap: 8,
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: 220,
      borderRadius: theme.radius.lg,
      backgroundColor: palette.surfaceHigh,
    },
    imageCaption: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 12,
    },
    strong: {
      fontWeight: '700',
    },
    emphasis: {
      fontStyle: 'italic',
    },
    underline: {
      textDecorationLine: 'underline',
    },
    small: {
      fontSize: 14,
    },
    verseNumber: {
      color: palette.primarySolid,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '700',
    },
    link: {
      color: palette.primarySolid,
      textDecorationLine: 'underline',
    },
    highlightedText: {
      backgroundColor: palette.highlight,
      color: palette.foreground,
    },
  });
}
