import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import {
  BlockContent,
  type TextSelection,
} from '../../components/BlockContent';
import { getAdjacentLessons, type ArchiveLesson } from '../../data/archive';
import { type AppPalette, type AppTypography } from '../../design';
import { type StaticText } from '../../i18n/staticText';
import {
  type LessonHighlight,
  type ReaderSettings,
  type StorageState,
} from '../../storage';
import {
  bibleVersionOptions,
  fetchBibleReferenceVersion,
  type BibleVersionId,
  type BibleVersionOption,
  type BibleVerseResult,
} from '../../services/bibleReferenceService';
import {
  fetchDictionaryEntry,
  normalizeDictionaryWord,
  type DictionaryEntry,
} from '../../services/dictionaryService';
import { type AppStyles } from '../styles';
import {
  GhostButton,
  GlassCard,
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
  { label: 'Peach', hex: '#FFD0A6' },
  { label: 'Sage', hex: '#D7E8A2' },
  { label: 'Coral', hex: '#FFB3A7' },
  { label: 'Lemon', hex: '#F7F48B' },
  { label: 'Aqua', hex: '#9DEBE7' },
  { label: 'Cornflower', hex: '#AFCBFF' },
  { label: 'Rose', hex: '#FFB8C8' },
  { label: 'Grape', hex: '#C7A7FF' },
  { label: 'Apricot', hex: '#FFC27A' },
  { label: 'Olive', hex: '#C9DA8F' },
  { label: 'Stone', hex: '#D8D2C4' },
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
  staticText,
  bottomChromeOffset = 0,
  searchTarget,
  chromeHidden,
  onBack,
  onOpenSaved,
  onOpenReaderSheet,
  onHideChrome,
  onShowChrome,
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
  staticText: StaticText;
  bottomChromeOffset?: number;
  searchTarget?: { query: string; nonce: number };
  chromeHidden: boolean;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenReaderSheet: () => void;
  onHideChrome: () => void;
  onShowChrome: () => void;
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
  const [activeBibleReference, setActiveBibleReference] = useState<
    string | null
  >(null);
  const [bibleResults, setBibleResults] = useState<BibleVerseResult[]>([]);
  const [selectedBibleVersion, setSelectedBibleVersion] =
    useState<BibleVersionId>('kjv');
  const [bibleVersionMenuOpen, setBibleVersionMenuOpen] = useState(false);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [activeDictionaryWord, setActiveDictionaryWord] = useState<
    string | null
  >(null);
  const [dictionaryEntry, setDictionaryEntry] =
    useState<DictionaryEntry | null>(null);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const contentCardYRef = useRef(0);
  const headerVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollOffsetRef = useRef(0);
  const userDraggingRef = useRef(false);
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const initializedLessonSlugRef = useRef('');
  const availableBibleVersionOptions = bibleVersionOptions.filter(
    option => option.language === settings.readingLanguage,
  );
  const blockSearchTarget = React.useMemo(
    () =>
      searchTarget
        ? { query: searchTarget.query, nonce: searchTarget.nonce }
        : undefined,
    [searchTarget],
  );
  const defaultBibleVersion =
    availableBibleVersionOptions[0]?.id ?? bibleVersionOptions[0].id;
  const activeBibleVersion = availableBibleVersionOptions.some(
    option => option.id === selectedBibleVersion,
  )
    ? selectedBibleVersion
    : defaultBibleVersion;

  useEffect(() => {
    if (selectedBibleVersion !== activeBibleVersion) {
      setSelectedBibleVersion(activeBibleVersion);
    }
  }, [activeBibleVersion, selectedBibleVersion]);

  useEffect(() => {
    Animated.timing(headerVisibility, {
      toValue: chromeHidden ? 0 : 1,
      duration: chromeHidden ? 210 : 260,
      useNativeDriver: true,
    }).start();
  }, [chromeHidden, headerVisibility]);

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

  useEffect(() => {
    if (!showResumePrompt) {
      return;
    }

    const timer = setTimeout(() => {
      setShowResumePrompt(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [showResumePrompt]);

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

  function openBibleReference(reference: string) {
    setActiveBibleReference(reference);
    setBibleResults([]);
    setBibleError(null);
    setBibleVersionMenuOpen(false);
    loadBibleVersion(reference, activeBibleVersion);
  }

  function loadBibleVersion(reference: string, versionId: BibleVersionId) {
    setBibleLoading(true);
    setBibleError(null);
    fetchBibleReferenceVersion(reference, versionId)
      .then(result => {
        setBibleResults([result]);
      })
      .catch(error => {
        setBibleResults([]);
        setBibleError(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load this Bible reference. Check your connection and try again.',
        );
      })
      .finally(() => {
        setBibleLoading(false);
      });
  }

  function closeBibleReference() {
    setActiveBibleReference(null);
    setBibleResults([]);
    setBibleError(null);
    setBibleLoading(false);
    setBibleVersionMenuOpen(false);
  }

  function openDictionary() {
    const word = activeSelection
      ? normalizeDictionaryWord(activeSelection.text)
      : null;
    if (!word) {
      return;
    }

    setActiveDictionaryWord(word);
    setDictionaryEntry(null);
    setDictionaryError(null);
    setDictionaryLoading(true);
    closeSelectionToolbar();
    fetchDictionaryEntry(word)
      .then(setDictionaryEntry)
      .catch(error => {
        setDictionaryEntry(null);
        setDictionaryError(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load this dictionary entry. Check your connection and try again.',
        );
      })
      .finally(() => {
        setDictionaryLoading(false);
      });
  }

  function closeDictionary() {
    setActiveDictionaryWord(null);
    setDictionaryEntry(null);
    setDictionaryError(null);
    setDictionaryLoading(false);
  }

  async function shareSelectedText() {
    if (!activeSelection) {
      return;
    }

    const underline = '-'.repeat(Math.min(48, activeSelection.text.length));
    await Share.share({
      title: lesson.title,
      message: `${activeSelection.text}\n${underline}\nChapter: ${seriesTitle}\nTitle: ${lesson.title}`,
    });
    closeSelectionToolbar();
  }

  const selectionSheetColors = getSelectionSheetColors(palette);
  const dictionaryWord = activeSelection
    ? normalizeDictionaryWord(activeSelection.text)
    : null;

  return (
    <View style={styles.screen}>
      <Animated.View
        pointerEvents={chromeHidden ? 'none' : 'auto'}
        style={[
          styles.readerFixedHeaderWrap,
          {
            opacity: headerVisibility,
            transform: [
              {
                translateY: headerVisibility.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-88, 0],
                }),
              },
              {
                scale: headerVisibility.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView
          style={styles.readerFixedHeaderBlur}
          blurAmount={28}
          reducedTransparencyFallbackColor={palette.surfaceHigh}
          blurType={palette.blurTint}
        />
        <View style={styles.readerFixedHeaderShell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={staticText.navigation.back}
            onPress={onBack}
            style={styles.readerFixedHeaderButton}
          >
            <Text style={styles.readerFixedHeaderButtonText}>‹</Text>
          </Pressable>
          <View style={styles.readerFixedHeaderTitleWrap}>
            <Text
              style={styles.readerFixedHeaderTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {lesson.title}
            </Text>
          </View>
          <View style={styles.readerFixedHeaderActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={staticText.reader.saved}
              onPress={onOpenSaved}
              style={styles.readerFixedHeaderButton}
            >
              <Text style={styles.readerFixedHeaderButtonText}>✦</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={staticText.reader.settings}
              onPress={onOpenReaderSheet}
              style={styles.readerFixedHeaderButton}
            >
              <Text style={styles.readerFixedHeaderButtonText}>Aa</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,
          styles.readerScrollContentWithFixedHeader,
        ]}
        scrollEventThrottle={120}
        onLayout={event => {
          layoutHeightRef.current = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, height) => {
          contentHeightRef.current = height;
        }}
        onScrollBeginDrag={event => {
          userDraggingRef.current = true;
          lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => {
          userDraggingRef.current = false;
        }}
        onMomentumScrollEnd={event => {
          userDraggingRef.current = false;
          lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScroll={event => {
          const viewport = event.nativeEvent.layoutMeasurement.height;
          const content = event.nativeEvent.contentSize.height;
          const offset = event.nativeEvent.contentOffset.y;
          const scrollDelta = offset - lastScrollOffsetRef.current;
          if (userDraggingRef.current) {
            if (scrollDelta > 8) {
              onHideChrome();
            } else if (scrollDelta < -8) {
              onShowChrome();
            }
            lastScrollOffsetRef.current = offset;
          }
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
              label={staticText.reader.share}
              onPress={shareLesson}
            />
          </View>
        </GlassCard>

        <View
          style={styles.readerContentWrap}
          onLayout={event => {
            contentCardYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <BlockContent
            blocks={lesson.blocks}
            lessonSlug={lesson.slug}
            settings={settings}
            highlights={highlights}
            activeSelection={activeSelection}
            palette={palette}
            typography={typography}
            searchTarget={blockSearchTarget}
            onSearchMatch={offsetY => {
              scrollRef.current?.scrollTo({
                y: Math.max(0, contentCardYRef.current + offsetY - 108),
                animated: true,
              });
            }}
            onSelectText={selection => {
              setActiveSelection(selection ?? null);
            }}
            onOpenLink={href => {
              const target = href.startsWith('http')
                ? href
                : `https://jacksequeira.org/${href.replace(/^\//, '')}`;
              Linking.openURL(target).catch(() => undefined);
            }}
            onOpenBibleReference={openBibleReference}
          />
        </View>

        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title={staticText.reader.personalNotes}
            subtitle={staticText.reader.personalNotesSubtitle}
          />
          <TextInput
            multiline
            placeholder={staticText.reader.notePlaceholder}
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
            title={staticText.reader.continue}
            subtitle={staticText.reader.continueSubtitle}
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
              <Text style={styles.navLinkText}>{staticText.reader.previous}</Text>
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
              <Text style={styles.navLinkText}>{staticText.reader.next}</Text>
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
            <Text style={styles.resumePromptTitle}>
              {staticText.reader.welcomeBack}
            </Text>
            <Text style={styles.resumePromptMeta}>
              Continue from {Math.round(resumeTargetRatio * 100)}%
            </Text>
          </Pressable>
        </View>
      ) : null}
      {chromeHidden ? (
        <Animated.View
          style={[
            styles.readerChromeMenuWrap,
            { bottom: bottomChromeOffset + 18 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show reading controls"
            onPress={onShowChrome}
            style={styles.readerChromeMenuButton}
          >
            <Text style={styles.readerChromeMenuIcon}>☰</Text>
          </Pressable>
        </Animated.View>
      ) : null}
      {activeSelection ? (
        <View
          style={[styles.selectionToolbar, { bottom: bottomChromeOffset + 88 }]}
        >
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectionColorScroller}
              contentContainerStyle={styles.selectionColorRow}
            >
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
            </ScrollView>

            <View style={styles.selectionActionGrid}>
              <ToolbarAction
                label={staticText.reader.copy}
                styles={styles}
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={() => {
                  Clipboard.setString(activeSelection.text);
                  closeSelectionToolbar();
                }}
              />
              <ToolbarAction
                label={staticText.reader.share}
                styles={styles}
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={shareSelectedText}
              />
              {dictionaryWord ? (
                <ToolbarAction
                  label="Define"
                  styles={styles}
                  palette={palette}
                  backgroundColor={selectionSheetColors.buttonBackground}
                  onPress={openDictionary}
                />
              ) : null}
              <ToolbarAction
                label={staticText.reader.clear}
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
      <BibleReferenceModal
        visible={Boolean(activeBibleReference)}
        styles={styles}
        palette={palette}
        reference={activeBibleReference}
        loading={bibleLoading}
        error={bibleError}
        results={bibleResults}
        selectedVersion={activeBibleVersion}
        versionOptions={availableBibleVersionOptions}
        versionMenuOpen={bibleVersionMenuOpen}
        onToggleVersionMenu={() => setBibleVersionMenuOpen(open => !open)}
        onSelectVersion={versionId => {
          setSelectedBibleVersion(versionId);
          setBibleVersionMenuOpen(false);
          if (activeBibleReference) {
            loadBibleVersion(activeBibleReference, versionId);
          }
        }}
        onClose={closeBibleReference}
      />
      <DictionaryModal
        visible={Boolean(activeDictionaryWord)}
        styles={styles}
        palette={palette}
        word={activeDictionaryWord}
        entry={dictionaryEntry}
        loading={dictionaryLoading}
        error={dictionaryError}
        onClose={closeDictionary}
      />
    </View>
  );
}

function DictionaryModal({
  visible,
  styles,
  palette,
  word,
  entry,
  loading,
  error,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  word: string | null;
  entry: DictionaryEntry | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bibleModalOverlay}>
        <Pressable style={styles.bibleModalBackdrop} onPress={onClose} />
        <View style={styles.dictionaryModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Dictionary</Text>
              <Text style={styles.bibleModalTitle}>{entry?.word ?? word}</Text>
              {entry?.phonetic ? (
                <Text style={styles.dictionaryPhonetic}>{entry.phonetic}</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dictionary"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>×</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.bibleModalLoadingRow}>
              <ActivityIndicator color={palette.primarySolid} />
              <Text style={styles.bibleModalMutedText}>
                Looking up definition...
              </Text>
            </View>
          ) : error ? (
            <Text style={styles.bibleModalErrorText}>{error}</Text>
          ) : entry ? (
            <ScrollView
              style={styles.bibleModalScroll}
              contentContainerStyle={styles.dictionaryDefinitionList}
            >
              {entry.definitions.map((definition, index) => (
                <View
                  key={`${definition.partOfSpeech}-${index}`}
                  style={styles.dictionaryDefinitionCard}
                >
                  <Text style={styles.dictionaryPartOfSpeech}>
                    {definition.partOfSpeech}
                  </Text>
                  <Text style={styles.dictionaryDefinitionText}>
                    {definition.definition}
                  </Text>
                  {definition.example ? (
                    <Text style={styles.dictionaryExampleText}>
                      {definition.example}
                    </Text>
                  ) : null}
                  {definition.synonyms.length > 0 ? (
                    <Text style={styles.dictionarySynonymsText}>
                      Synonyms: {definition.synonyms.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function BibleReferenceModal({
  visible,
  styles,
  palette,
  reference,
  loading,
  error,
  results,
  selectedVersion,
  versionOptions,
  versionMenuOpen,
  onToggleVersionMenu,
  onSelectVersion,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  reference: string | null;
  loading: boolean;
  error: string | null;
  results: BibleVerseResult[];
  selectedVersion: BibleVersionId;
  versionOptions: BibleVersionOption[];
  versionMenuOpen: boolean;
  onToggleVersionMenu: () => void;
  onSelectVersion: (versionId: BibleVersionId) => void;
  onClose: () => void;
}) {
  const selectedVersionOption =
    versionOptions.find(option => option.id === selectedVersion) ??
    versionOptions[0] ??
    bibleVersionOptions[0];
  const result = results[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bibleModalOverlay}>
        <Pressable style={styles.bibleModalBackdrop} onPress={onClose} />
        <View style={styles.bibleModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Bible Reference</Text>
              <Text style={styles.bibleModalTitle}>{reference ?? ''}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Bible reference"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.bibleVersionDropdownWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose Bible version"
              onPress={onToggleVersionMenu}
              style={styles.bibleVersionDropdownButton}
            >
              <View>
                <Text style={styles.bibleVersionDropdownLabel}>Version</Text>
                <Text style={styles.bibleVersionDropdownValue}>
                  {selectedVersionOption.label}
                </Text>
              </View>
              <Text style={styles.bibleVersionDropdownChevron}>
                {versionMenuOpen ? '⌃' : '⌄'}
              </Text>
            </Pressable>
            {versionMenuOpen ? (
              <View style={styles.bibleVersionDropdownMenu}>
                {versionOptions.map(option => {
                  const active = option.id === selectedVersion;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => onSelectVersion(option.id)}
                      style={[
                        styles.bibleVersionDropdownOption,
                        active && styles.bibleVersionDropdownOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bibleVersionDropdownOptionLabel,
                          active &&
                            styles.bibleVersionDropdownOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.bibleVersionDropdownOptionName}>
                        {option.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.bibleModalLoadingRow}>
              <ActivityIndicator color={palette.primarySolid} />
              <Text style={styles.bibleModalMutedText}>Loading verses...</Text>
            </View>
          ) : error ? (
            <Text style={styles.bibleModalErrorText}>{error}</Text>
          ) : result?.notice ? (
            <View style={styles.bibleVersionCard}>
              <Text style={styles.bibleModalMutedText}>{result.notice}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.bibleModalScroll}
              contentContainerStyle={styles.bibleModalScrollContent}
            >
              {result ? (
                <View style={styles.bibleVersionCard}>
                  <View style={styles.bibleVersionHeader}>
                    <Text style={styles.bibleVersionName}>
                      {result.translationName}
                    </Text>
                    <Text style={styles.bibleVersionId}>
                      {result.translationId.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bibleVerseList}>
                    {result.verses.map((verse, index) => (
                      <View
                        key={`${verse.verse}-${index}`}
                        style={styles.bibleVerseRow}
                      >
                        <Text style={styles.bibleVerseNumber}>
                          {verse.verse}
                        </Text>
                        <Text style={styles.bibleVerseText}>{verse.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
