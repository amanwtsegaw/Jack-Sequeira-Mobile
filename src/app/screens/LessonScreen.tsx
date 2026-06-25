import React, { useEffect, useRef, useState } from 'react';
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
  const [resumeTargetRatio, setResumeTargetRatio] = useState<number | null>(
    null,
  );
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const initializedLessonSlugRef = useRef('');

  useEffect(() => {
    if (initializedLessonSlugRef.current === lesson.slug) {
      return;
    }

    initializedLessonSlugRef.current = lesson.slug;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });

    const shouldOfferResume =
      typeof progress?.ratio === 'number' &&
      progress.ratio >= 0.05 &&
      progress.ratio <= 0.97;
    setResumeTargetRatio(shouldOfferResume ? progress.ratio : null);
    setShowResumePrompt(shouldOfferResume);
  }, [lesson.slug, progress?.ratio]);

  function jumpToSavedProgress() {
    if (
      resumeTargetRatio === null ||
      !layoutHeightRef.current ||
      !contentHeightRef.current
    ) {
      return;
    }

    const maxOffset = Math.max(
      0,
      contentHeightRef.current - layoutHeightRef.current,
    );
    setShowResumePrompt(false);
    scrollRef.current?.scrollTo({
      y: maxOffset * resumeTargetRatio,
      animated: true,
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
        }}
        onContentSizeChange={(_, height) => {
          contentHeightRef.current = height;
        }}
        onScroll={event => {
          const viewport = event.nativeEvent.layoutMeasurement.height;
          const content = event.nativeEvent.contentSize.height;
          const offset = event.nativeEvent.contentOffset.y;
          const maxOffset = Math.max(1, content - viewport);
          const ratio = maxOffset === 0 ? 0 : offset / maxOffset;
          if (
            showResumePrompt &&
            resumeTargetRatio !== null &&
            Math.abs(ratio - resumeTargetRatio) < 0.03
          ) {
            setShowResumePrompt(false);
          }
          onUpdateProgress(ratio);
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
            <Pressable
              disabled={!adjacent.previous}
              onPress={() => {
                if (adjacent.previous) {
                  onOpenLesson(adjacent.previous.slug);
                }
              }}
              style={[
                styles.navLinkCard,
                styles.navigationButton,
                !adjacent.previous && styles.navigationButtonDisabled,
              ]}
            >
              <Text style={styles.navLinkText}>Previous</Text>
            </Pressable>
            <Pressable
              disabled={!adjacent.next}
              onPress={() => {
                if (adjacent.next) {
                  onOpenLesson(adjacent.next.slug);
                }
              }}
              style={[
                styles.navLinkCard,
                styles.navigationButton,
                !adjacent.next && styles.navigationButtonDisabled,
              ]}
            >
              <Text style={styles.navLinkText}>Next</Text>
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
      {showResumePrompt && resumeTargetRatio !== null ? (
        <View style={styles.resumePromptWrap} pointerEvents="box-none">
          <Pressable
            onPress={jumpToSavedProgress}
            style={styles.resumePromptCard}
          >
            <Text style={styles.resumePromptTitle}>Welcome back</Text>
            <Text style={styles.resumePromptMeta}>
              Continue from {Math.round(resumeTargetRatio * 100)}%
            </Text>
          </Pressable>
        </View>
      ) : null}
      {activeSelection ? (
        <View style={styles.selectionToolbar}>
          <View
            style={[
              styles.selectionSheet,
              {
                backgroundColor: selectionSheetColors.background,
                borderColor: selectionSheetColors.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.selectionSheetHeader}>
              <View style={styles.selectionHeaderText}>
                <Text
                  style={[styles.selectionTitle, { color: palette.foreground }]}
                >
                  Selected Text
                </Text>
                <Text
                  style={[
                    styles.selectionPreview,
                    { color: palette.mutedStrong },
                  ]}
                  numberOfLines={2}
                >
                  {activeSelection.text}
                </Text>
              </View>
              <Pressable
                onPress={closeSelectionToolbar}
                style={styles.selectionCloseButton}
              >
                <Text
                  style={[
                    styles.selectionCloseButtonText,
                    { color: palette.primarySolid },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>

            <View style={styles.selectionColorRow}>
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
                    styles.selectionColorSwatch,
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

            <View style={styles.selectionActionGrid}>
              <ToolbarAction
                label="Copy"
                styles={styles}
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={() => {
                  Clipboard.setString(activeSelection.text);
                  closeSelectionToolbar();
                }}
              />
              <ToolbarAction
                label="Clear"
                styles={styles}
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
  styles,
  palette,
  backgroundColor,
  onPress,
}: {
  label: string;
  styles: AppStyles;
  palette: AppPalette;
  backgroundColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectionActionButton,
        {
          backgroundColor,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <Text
        style={[
          styles.selectionActionButtonText,
          { color: palette.foreground },
        ]}
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
