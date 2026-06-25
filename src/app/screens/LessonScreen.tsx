import React, { useRef, useState } from 'react';
import {
  Clipboard,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BlockContent,
  type TextSelection,
} from '../../components/BlockContent';
import { getAdjacentLessons, type ArchiveLesson } from '../../data/archive';
import { type AppPalette, type AppTypography } from '../../design';
import {
  type LessonHighlight,
  type ReaderSettings,
  type StorageState,
} from '../../storage';
import { type AppStyles } from '../styles';
import {
  GhostButton,
  GlassCard,
  GlassHeader,
  InfoChip,
  PillButton,
  SectionHeader,
} from '../components/Shared';

const HIGHLIGHT_COLORS = [
  { label: 'Pastel Yellow', hex: '#FFF3A3' },
  { label: 'Mint Green', hex: '#BFF3D0' },
  { label: 'Sky Blue', hex: '#BFE7FF' },
  { label: 'Soft Pink', hex: '#FFD1DC' },
  { label: 'Lavender', hex: '#DCCBFF' },
];

export function LessonScreen({
  lesson,
  seriesTitle,
  adjacent,
  note,
  highlights,
  isFavorite,
  progress,
  settings,
  palette,
  typography,
  styles,
  onBack,
  onOpenSaved,
  onOpenReaderSheet,
  onToggleFavorite,
  onOpenLesson,
  onSaveHighlight,
  onClearHighlight,
  onUpdateProgress,
  onUpdateNote,
}: {
  lesson: ArchiveLesson;
  seriesTitle: string;
  adjacent: ReturnType<typeof getAdjacentLessons>;
  note: string;
  highlights: LessonHighlight[];
  isFavorite: boolean;
  progress?: StorageState['progress'][string];
  settings: ReaderSettings;
  palette: AppPalette;
  typography: AppTypography;
  styles: AppStyles;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenReaderSheet: () => void;
  onToggleFavorite: () => void;
  onOpenLesson: (lessonSlug: string) => void;
  onSaveHighlight: (highlight: {
    id: string;
    text: string;
    color?: string;
    style?: 'highlight' | 'underline';
    note?: string;
  }) => void;
  onClearHighlight: (highlightId: string) => void;
  onUpdateProgress: (ratio: number) => void;
  onUpdateNote: (value: string) => void;
}) {
  const [activeSelection, setActiveSelection] = useState<TextSelection | null>(
    null,
  );
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].hex);
  const scrollRef = useRef<ScrollView>(null);
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const restoredRef = useRef(false);

  function maybeRestoreProgress() {
    if (
      restoredRef.current ||
      !progress?.ratio ||
      !layoutHeightRef.current ||
      !contentHeightRef.current
    ) {
      return;
    }

    const maxOffset = Math.max(
      0,
      contentHeightRef.current - layoutHeightRef.current,
    );
    restoredRef.current = true;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: maxOffset * progress.ratio,
        animated: false,
      });
    });
  }

  async function shareLesson() {
    await Share.share({
      message: `${lesson.title}\nhttps://jacksequeira.org/series/${lesson.seriesSlug}/${lesson.slug}`,
      title: lesson.title,
    });
  }

  function saveSelectedHighlight(color: string) {
    if (!activeSelection) {
      return;
    }

    onSaveHighlight({
      id: activeSelection.id,
      text: activeSelection.text,
      color,
      style: 'highlight',
    });
  }

  function closeSelectionToolbar() {
    setActiveSelection(null);
  }

  const selectionSheetColors = getSelectionSheetColors(palette);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        scrollEventThrottle={120}
        onLayout={event => {
          layoutHeightRef.current = event.nativeEvent.layout.height;
          maybeRestoreProgress();
        }}
        onContentSizeChange={(_, height) => {
          contentHeightRef.current = height;
          maybeRestoreProgress();
        }}
        onScroll={event => {
          const viewport = event.nativeEvent.layoutMeasurement.height;
          const content = event.nativeEvent.contentSize.height;
          const offset = event.nativeEvent.contentOffset.y;
          const maxOffset = Math.max(1, content - viewport);
          onUpdateProgress(maxOffset === 0 ? 0 : offset / maxOffset);
        }}
      >
        <View style={styles.stickyHeaderWrap}>
          <GlassHeader
            styles={styles}
            title="Reader"
            leftAction={{ icon: '‹', label: 'Back', onPress: onBack }}
            actions={[
              { icon: '✦', label: 'Saved', onPress: onOpenSaved },
              { icon: 'Aa', label: 'Settings', onPress: onOpenReaderSheet },
            ]}
          />
        </View>

        <GlassCard styles={styles}>
          <Text style={styles.eyebrow}>{seriesTitle}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.bodyMuted}>
            {lesson.description || lesson.preview}
          </Text>
          <View style={styles.metaRow}>
            <InfoChip
              styles={styles}
              label={`${Math.round((progress?.ratio ?? 0) * 100)}% read`}
            />
            <InfoChip styles={styles} label={lesson.readingTimeLabel} />
            <InfoChip
              styles={styles}
              label={`${highlights.length} highlights`}
            />
          </View>
          <View style={styles.toolbarRow}>
            <PillButton
              styles={styles}
              label={isFavorite ? 'Saved lesson' : 'Save lesson'}
              onPress={onToggleFavorite}
            />
            <GhostButton
              styles={styles}
              palette={palette}
              label="Share"
              onPress={shareLesson}
            />
          </View>
        </GlassCard>

        <GlassCard styles={styles}>
          <BlockContent
            blocks={lesson.blocks}
            lessonSlug={lesson.slug}
            settings={settings}
            highlights={highlights}
            activeSelection={activeSelection}
            palette={palette}
            typography={typography}
            onSelectText={selection => {
              setActiveSelection(selection ?? null);
            }}
            onOpenLink={href => {
              const target = href.startsWith('http')
                ? href
                : `https://jacksequeira.org/${href.replace(/^\//, '')}`;
              Linking.openURL(target).catch(() => undefined);
            }}
          />
        </GlassCard>

        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Personal Notes"
            subtitle="Keep short reflections with the lesson."
          />
          <TextInput
            multiline
            placeholder="Write your notes here..."
            placeholderTextColor={palette.muted}
            value={note}
            onChangeText={onUpdateNote}
            style={styles.noteInput}
            textAlignVertical="top"
          />
        </GlassCard>

        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Continue"
            subtitle="Move through the series from here."
          />
          <View style={styles.navigationRow}>
            <View style={styles.navigationColumn}>
              <Text style={styles.navLabel}>Previous</Text>
              {adjacent.previous ? (
                <Pressable
                  onPress={() => onOpenLesson(adjacent.previous!.slug)}
                  style={styles.navLinkCard}
                >
                  <Text style={styles.navLinkText}>
                    {adjacent.previous.title}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.bodyMuted}>Start of series</Text>
              )}
            </View>
            <View style={styles.navigationColumn}>
              <Text style={styles.navLabel}>Next</Text>
              {adjacent.next ? (
                <Pressable
                  onPress={() => onOpenLesson(adjacent.next!.slug)}
                  style={styles.navLinkCard}
                >
                  <Text style={styles.navLinkText}>{adjacent.next.title}</Text>
                </Pressable>
              ) : (
                <Text style={styles.bodyMuted}>End of series</Text>
              )}
            </View>
          </View>
        </GlassCard>
      </ScrollView>
      {activeSelection ? (
        <View style={localStyles.selectionToolbar}>
          <View
            style={[
              localStyles.selectionSheet,
              {
                backgroundColor: selectionSheetColors.background,
                borderColor: selectionSheetColors.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={localStyles.selectionSheetHeader}>
              <View style={localStyles.selectionHeaderText}>
                <Text
                  style={[
                    localStyles.selectionTitle,
                    { color: palette.foreground },
                  ]}
                >
                  Selected Text
                </Text>
                <Text
                  style={[
                    localStyles.selectionPreview,
                    { color: palette.mutedStrong },
                  ]}
                  numberOfLines={2}
                >
                  {activeSelection.text}
                </Text>
              </View>
              <Pressable
                onPress={closeSelectionToolbar}
                style={localStyles.closeButton}
              >
                <Text
                  style={[
                    localStyles.closeButtonText,
                    { color: palette.primarySolid },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>

            <View style={localStyles.colorRow}>
              {HIGHLIGHT_COLORS.map(color => (
                <Pressable
                  key={color.hex}
                  accessibilityLabel={color.label}
                  onPress={() => {
                    setSelectedColor(color.hex);
                    saveSelectedHighlight(color.hex);
                    closeSelectionToolbar();
                  }}
                  style={[
                    localStyles.colorSwatch,
                    {
                      backgroundColor: color.hex,
                      borderColor:
                        selectedColor === color.hex
                          ? palette.foreground
                          : palette.outline,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={localStyles.actionGrid}>
              <ToolbarAction
                label="Copy"
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={() => {
                  Clipboard.setString(activeSelection.text);
                  closeSelectionToolbar();
                }}
              />
              <ToolbarAction
                label="Clear"
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={() => {
                  onClearHighlight(activeSelection.id);
                  closeSelectionToolbar();
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ToolbarAction({
  label,
  palette,
  backgroundColor,
  onPress,
}: {
  label: string;
  palette: AppPalette;
  backgroundColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        localStyles.actionButton,
        {
          backgroundColor,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <Text
        style={[localStyles.actionButtonText, { color: palette.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getSelectionSheetColors(palette: AppPalette) {
  if (palette.blurTint === 'dark') {
    return {
      background: '#2f261d',
      border: 'rgba(255,255,255,0.18)',
      buttonBackground: '#3b3024',
    };
  }

  return {
    background: '#fffaf0',
    border: 'rgba(60,45,30,0.16)',
    buttonBackground: '#f4eadb',
  };
}

const localStyles = {
  selectionToolbar: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 18,
    zIndex: 20,
    elevation: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  selectionSheet: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  selectionSheetHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  selectionHeaderText: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  selectionPreview: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  colorRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
  },
  actionGrid: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
};
