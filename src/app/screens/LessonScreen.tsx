import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Clipboard,
  Linking,
  Modal,
  NativeModules,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
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

const SHARE_IMAGE_SIZES = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
  { id: '3:4', label: '3:4', width: 1080, height: 1440 },
  { id: '9:16', label: '9:16', width: 1080, height: 1920 },
  { id: '16:9', label: '16:9', width: 1600, height: 900 },
] as const;

type ShareImageSize = (typeof SHARE_IMAGE_SIZES)[number];

type ShareImageModule = {
  open: (options: {
    title?: string;
    type?: string;
    url: string;
    filename?: string;
    failOnCancel?: boolean;
  }) => Promise<unknown>;
};

type RNFSModule = {
  CachesDirectoryPath: string;
  exists: (filepath: string) => Promise<boolean>;
  mkdir: (filepath: string) => Promise<void>;
  moveFile: (filepath: string, destPath: string) => Promise<void>;
  writeFile: (
    filepath: string,
    contents: string,
    encoding?: 'utf8' | 'base64' | 'ascii',
  ) => Promise<void>;
  unlink: (filepath: string) => Promise<void>;
};

const SHARE_IMAGE_TEXT_LIMIT = 420;

const SHARE_IMAGE_THEMES = [
  {
    id: 'ministry-dark',
    label: 'Ministry Dark',
    mode: 'Dark',
    background: '#17051f',
    foreground: '#fff7ee',
    muted: 'rgba(255,247,238,0.72)',
    accent: '#d8b5ff',
    panel: 'rgba(255,247,238,0.1)',
    line: 'rgba(216,181,255,0.48)',
    glowOne: 'rgba(180,87,232,0.32)',
    glowTwo: 'rgba(255,213,244,0.12)',
  },
  {
    id: 'ministry-light',
    label: 'Ministry Light',
    mode: 'Light',
    background: '#fbf4ff',
    foreground: '#26162e',
    muted: 'rgba(38,22,46,0.66)',
    accent: '#934cc5',
    panel: 'rgba(255,255,255,0.62)',
    line: 'rgba(147,76,197,0.34)',
    glowOne: 'rgba(180,87,232,0.16)',
    glowTwo: 'rgba(255,213,244,0.5)',
  },
  {
    id: 'dark-gold',
    label: 'Archive Dark',
    mode: 'Dark',
    background: '#20160f',
    foreground: '#fff4df',
    muted: 'rgba(255,244,223,0.7)',
    accent: '#d29c35',
    panel: 'rgba(255,244,223,0.11)',
    line: 'rgba(210,156,53,0.5)',
    glowOne: 'rgba(210,156,53,0.28)',
    glowTwo: 'rgba(255,247,232,0.1)',
  },
  {
    id: 'gold-light',
    label: 'Archive Light',
    mode: 'Light',
    background: '#fff7e8',
    foreground: '#312214',
    muted: 'rgba(49,34,20,0.64)',
    accent: '#af7630',
    panel: 'rgba(255,255,255,0.58)',
    line: 'rgba(175,118,48,0.34)',
    glowOne: 'rgba(210,156,53,0.2)',
    glowTwo: 'rgba(255,255,255,0.6)',
  },
  {
    id: 'sepia-dark',
    label: 'Sepia Dark',
    mode: 'Dark',
    background: '#211911',
    foreground: '#f8ead5',
    muted: 'rgba(248,234,213,0.68)',
    accent: '#c4904e',
    panel: 'rgba(248,234,213,0.1)',
    line: 'rgba(196,144,78,0.48)',
    glowOne: 'rgba(196,144,78,0.24)',
    glowTwo: 'rgba(246,224,182,0.12)',
  },
  {
    id: 'sepia-light',
    label: 'Sepia Light',
    mode: 'Light',
    background: '#f4e4c9',
    foreground: '#34261a',
    muted: 'rgba(52,38,26,0.64)',
    accent: '#9d6c2e',
    panel: 'rgba(255,249,238,0.72)',
    line: 'rgba(157,108,46,0.32)',
    glowOne: 'rgba(196,145,78,0.2)',
    glowTwo: 'rgba(255,249,238,0.66)',
  },
  {
    id: 'green-dark',
    label: 'Sage Dark',
    mode: 'Dark',
    background: '#101f1b',
    foreground: '#effbf6',
    muted: 'rgba(239,251,246,0.68)',
    accent: '#65d7b6',
    panel: 'rgba(239,251,246,0.1)',
    line: 'rgba(101,215,182,0.45)',
    glowOne: 'rgba(56,171,138,0.26)',
    glowTwo: 'rgba(183,235,220,0.12)',
  },
  {
    id: 'green-light',
    label: 'Sage Light',
    mode: 'Light',
    background: '#edf8f4',
    foreground: '#172820',
    muted: 'rgba(23,40,32,0.66)',
    accent: '#2c8f7a',
    panel: 'rgba(255,255,255,0.64)',
    line: 'rgba(44,143,122,0.3)',
    glowOne: 'rgba(56,171,138,0.18)',
    glowTwo: 'rgba(183,235,220,0.42)',
  },
] as const;

type ShareImageTheme = (typeof SHARE_IMAGE_THEMES)[number];

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
  const [noteSelection, setNoteSelection] = useState<TextSelection | null>(
    null,
  );
  const [noteDraft, setNoteDraft] = useState('');
  const [activeInlineNote, setActiveInlineNote] =
    useState<LessonHighlight | null>(null);
  const [shareImageSelection, setShareImageSelection] =
    useState<TextSelection | null>(null);
  const [selectedShareImageSize, setSelectedShareImageSize] =
    useState<ShareImageSize>(SHARE_IMAGE_SIZES[0]);
  const [selectedShareImageTheme, setSelectedShareImageTheme] =
    useState<ShareImageTheme>(SHARE_IMAGE_THEMES[0]);
  const [selectedShareImageFontSize, setSelectedShareImageFontSize] = useState(
    () => getShareImageFontRange(SHARE_IMAGE_SIZES[0]).defaultValue,
  );
  const [shareImageLoading, setShareImageLoading] = useState(false);
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

  function openAddNoteModal() {
    if (!activeSelection) {
      return;
    }

    const existingAnnotation = highlights.find(
      highlight => highlight.id === activeSelection.id,
    );
    const existingNote = existingAnnotation?.note ?? '';
    setNoteSelection(activeSelection);
    setNoteDraft(existingNote);
  }

  function closeAddNoteModal() {
    setNoteSelection(null);
    setNoteDraft('');
  }

  function saveInlineNote() {
    const trimmedNote = noteDraft.trim();
    if (!noteSelection || !trimmedNote) {
      return;
    }

    const existingAnnotation = highlights.find(
      highlight => highlight.id === noteSelection.id,
    );

    onSaveHighlight({
      id: noteSelection.id,
      text: noteSelection.text,
      color: existingAnnotation?.color ?? selectedColor,
      style:
        existingAnnotation?.style === 'highlight' ? 'highlight' : 'underline',
      note: trimmedNote,
    });
    closeSelectionToolbar();
    closeAddNoteModal();
  }

  function editInlineNote(highlight: LessonHighlight) {
    setActiveInlineNote(null);
    setNoteSelection({
      id: highlight.id,
      paragraphKey: '',
      startIndex: 0,
      endIndex: Math.max(0, highlight.text.length - 1),
      text: highlight.text,
    });
    setNoteDraft(highlight.note ?? '');
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

  function openShareImageModal() {
    if (!activeSelection) {
      return;
    }

    setShareImageSelection(activeSelection);
  }

  function closeShareImageModal() {
    if (shareImageLoading) {
      return;
    }

    setShareImageSelection(null);
  }

  function selectShareImageSize(size: ShareImageSize) {
    const range = getShareImageFontRange(size);
    setSelectedShareImageSize(size);
    setSelectedShareImageFontSize(current =>
      clampShareImageFontSize(current, range),
    );
  }

  function closeDictionary() {
    setActiveDictionaryWord(null);
    setDictionaryEntry(null);
    setDictionaryError(null);
    setDictionaryLoading(false);
  }

  const selectionSheetColors = getSelectionSheetColors(palette);
  const selectionToolbarBottom = chromeHidden
    ? bottomChromeOffset + 24
    : bottomChromeOffset + 88;
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
              ellipsizeMode="tail"
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
            onOpenHighlightNote={highlight => {
              if (highlight.note) {
                setActiveInlineNote(highlight);
              }
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
              <Text style={styles.navLinkText}>
                {staticText.reader.previous}
              </Text>
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
      {chromeHidden && !activeSelection ? (
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
          style={[styles.selectionToolbar, { bottom: selectionToolbarBottom }]}
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
                label="Add note"
                styles={styles}
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={openAddNoteModal}
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
                label="Share as image"
                styles={styles}
                palette={palette}
                backgroundColor={selectionSheetColors.buttonBackground}
                onPress={openShareImageModal}
              />
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
      <InlineNoteEditorModal
        visible={Boolean(noteSelection)}
        styles={styles}
        palette={palette}
        selection={noteSelection}
        value={noteDraft}
        canSave={noteDraft.trim().length > 0}
        onChangeValue={setNoteDraft}
        onSave={saveInlineNote}
        onClose={closeAddNoteModal}
      />
      <ShareImageModal
        visible={Boolean(shareImageSelection)}
        styles={styles}
        palette={palette}
        typography={typography}
        selection={shareImageSelection}
        seriesTitle={seriesTitle}
        lessonTitle={lesson.title}
        selectedSize={selectedShareImageSize}
        sizes={SHARE_IMAGE_SIZES}
        selectedTheme={selectedShareImageTheme}
        themes={SHARE_IMAGE_THEMES}
        selectedFontSize={selectedShareImageFontSize}
        loading={shareImageLoading}
        onSelectSize={selectShareImageSize}
        onSelectTheme={setSelectedShareImageTheme}
        onSelectFontSize={setSelectedShareImageFontSize}
        onShareStart={() => setShareImageLoading(true)}
        onShareEnd={() => setShareImageLoading(false)}
        onShared={() => {
          closeSelectionToolbar();
          setShareImageSelection(null);
        }}
        onClose={closeShareImageModal}
      />
      <InlineNoteViewModal
        visible={Boolean(activeInlineNote)}
        styles={styles}
        palette={palette}
        highlight={activeInlineNote}
        onEdit={editInlineNote}
        onClose={() => setActiveInlineNote(null)}
      />
    </View>
  );
}

function ShareImageModal({
  visible,
  styles,
  palette,
  typography,
  selection,
  seriesTitle,
  lessonTitle,
  selectedSize,
  sizes,
  selectedTheme,
  themes,
  selectedFontSize,
  loading,
  onSelectSize,
  onSelectTheme,
  onSelectFontSize,
  onShareStart,
  onShareEnd,
  onShared,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  typography: AppTypography;
  selection: TextSelection | null;
  seriesTitle: string;
  lessonTitle: string;
  selectedSize: ShareImageSize;
  sizes: readonly ShareImageSize[];
  selectedTheme: ShareImageTheme;
  themes: readonly ShareImageTheme[];
  selectedFontSize: number;
  loading: boolean;
  onSelectSize: (size: ShareImageSize) => void;
  onSelectTheme: (theme: ShareImageTheme) => void;
  onSelectFontSize: (fontSize: number) => void;
  onShareStart: () => void;
  onShareEnd: () => void;
  onShared: () => void;
  onClose: () => void;
}) {
  const [exportJob, setExportJob] = useState<{
    id: string;
    html: string;
    fileName: string;
    title: string;
  } | null>(null);
  const sourceTitle = `${seriesTitle} - ${lessonTitle}`;
  const quoteDraft = buildShareImageDraft(selection?.text ?? '');
  const fontRange = getShareImageFontRange(selectedSize);
  const effectiveFontSize = clampShareImageFontSize(
    selectedFontSize,
    fontRange,
  );
  const sourceFileName = buildShareImageFileName({
    seriesTitle,
    lessonTitle,
    size: selectedSize,
  });

  function shareSelectionImage() {
    if (!selection || loading) {
      return;
    }

    onShareStart();
    setExportJob({
      id: `${Date.now()}`,
      title: sourceTitle,
      fileName: sourceFileName,
      html: buildShareImageCanvasHtml({
        text: quoteDraft.text,
        seriesTitle,
        lessonTitle,
        size: selectedSize,
        theme: selectedTheme,
        fontSize: effectiveFontSize,
        minFontSize: fontRange.minimumValue,
      }),
    });
  }

  async function handleExportMessage(event: WebViewMessageEvent) {
    const activeJob = exportJob;
    if (!activeJob) {
      return;
    }

    try {
      const payload = JSON.parse(event.nativeEvent.data) as
        | { type: 'quoteExportReady'; dataUrl: string }
        | { type: 'quoteExportError'; message?: string };

      if (payload.type === 'quoteExportError') {
        throw new Error(payload.message ?? 'The image could not be created.');
      }

      if (payload.type !== 'quoteExportReady') {
        return;
      }

      setExportJob(null);
      const shareUri = await saveShareImageDataUrl(
        payload.dataUrl,
        activeJob.fileName,
      );
      await getShareImageModule().open({
        title: activeJob.title,
        type: 'image/png',
        url: shareUri,
        filename: activeJob.fileName.replace(/\.png$/i, ''),
        failOnCancel: false,
      });
      onShared();
    } catch (error) {
      setExportJob(null);
      Alert.alert(
        'Unable to share image',
        error instanceof Error && error.message
          ? error.message
          : 'Please try again.',
      );
    } finally {
      onShareEnd();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bibleModalOverlay}>
        <Pressable style={styles.bibleModalBackdrop} onPress={onClose} />
        <View style={styles.shareImageModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Image export</Text>
              <Text style={styles.bibleModalTitle}>{sourceTitle}</Text>
              <Text style={styles.shareImageCounterText}>
                Using {quoteDraft.text.length}/{SHARE_IMAGE_TEXT_LIMIT}{' '}
                characters{quoteDraft.truncated ? ' (trimmed)' : ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close image sharing"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.shareImageOptionsScroll}
            contentContainerStyle={styles.shareImageOptionsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.shareImageControlGroup}>
              <Text style={styles.shareImageControlLabel}>Size</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shareImageSizeRow}
              >
                {sizes.map(size => {
                  const active = size.id === selectedSize.id;
                  return (
                    <Pressable
                      key={size.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${size.label} image size`}
                      onPress={() => onSelectSize(size)}
                      style={[
                        styles.shareImageSizeButton,
                        active && styles.shareImageSizeButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.shareImageSizeButtonText,
                          active && styles.shareImageSizeButtonTextActive,
                        ]}
                      >
                        {size.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.shareImageControlGroup}>
              <Text style={styles.shareImageControlLabel}>Theme</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shareImageThemeRow}
              >
                {themes.map(themeOption => {
                  const active = themeOption.id === selectedTheme.id;
                  return (
                    <Pressable
                      key={themeOption.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${themeOption.label}`}
                      onPress={() => onSelectTheme(themeOption)}
                      style={[
                        styles.shareImageThemeButton,
                        active && styles.shareImageThemeButtonActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.shareImageThemeSwatch,
                          { backgroundColor: themeOption.background },
                        ]}
                      >
                        <View
                          style={[
                            styles.shareImageThemeSwatchAccent,
                            { backgroundColor: themeOption.accent },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.shareImageThemeButtonText,
                          active && styles.shareImageThemeButtonTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {themeOption.label}
                      </Text>
                      <Text style={styles.shareImageThemeModeText}>
                        {themeOption.mode}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.shareImageControlGroup}>
              <View style={styles.shareImageFontHeader}>
                <Text style={styles.shareImageControlLabel}>Font size</Text>
                <Text style={styles.shareImageCounterText}>
                  {effectiveFontSize}px
                </Text>
              </View>
              <View style={styles.shareImageFontSliderRow}>
                <Text style={styles.shareImageFontSmallT}>T</Text>
                <Slider
                  style={styles.shareImageFontSlider}
                  minimumValue={fontRange.minimumValue}
                  maximumValue={fontRange.maximumValue}
                  step={1}
                  value={effectiveFontSize}
                  minimumTrackTintColor={palette.primarySolid}
                  maximumTrackTintColor={palette.outline}
                  thumbTintColor={palette.primarySolid}
                  onValueChange={value => onSelectFontSize(Math.round(value))}
                />
                <Text style={styles.shareImageFontLargeT}>T</Text>
              </View>
            </View>

            <View style={styles.shareImagePreviewWrap}>
              <ShareImagePreview
                styles={styles}
                typography={typography}
                text={quoteDraft.text}
                seriesTitle={seriesTitle}
                lessonTitle={lessonTitle}
                theme={selectedTheme}
                aspectRatio={selectedSize.width / selectedSize.height}
                fontSize={effectiveFontSize}
              />
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={shareSelectionImage}
            style={[
              styles.shareImagePrimaryButton,
              { backgroundColor: palette.primarySolid },
              loading && styles.inlineNoteSaveButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={styles.shareImagePrimaryButtonText}>
                Share image
              </Text>
            )}
          </Pressable>
          {exportJob ? (
            <WebView
              key={exportJob.id}
              originWhitelist={['*']}
              source={{ html: exportJob.html }}
              onMessage={handleExportMessage}
              javaScriptEnabled
              domStorageEnabled={false}
              scrollEnabled={false}
              style={styles.shareImageWorker}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function ShareImagePreview({
  styles,
  typography,
  text,
  seriesTitle,
  lessonTitle,
  theme,
  aspectRatio,
  fontSize,
}: {
  styles: AppStyles;
  typography: AppTypography;
  text: string;
  seriesTitle: string;
  lessonTitle: string;
  theme: ShareImageTheme;
  aspectRatio: number;
  fontSize: number;
}) {
  const compact = aspectRatio > 1.25;
  const quoteSize = Math.max(
    14,
    Math.round(fontSize * (compact ? 0.36 : 0.38)),
  );
  return (
    <View
      style={[
        styles.quoteExportPreviewCard,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View
        style={[
          styles.quoteExportPreviewAccent,
          { backgroundColor: theme.accent },
        ]}
      />
      <View
        style={[styles.quoteExportPreviewPanel, { borderColor: theme.line }]}
      >
        <Text style={[styles.quoteExportPreviewBrand, { color: theme.accent }]}>
          JACK SEQUEIRA MINISTRIES
        </Text>
        <Text
          style={[
            styles.quoteExportPreviewQuote,
            {
              color: theme.foreground,
              fontFamily: typography.reading,
              fontSize: quoteSize,
              lineHeight: Math.round(quoteSize * 1.18),
            },
          ]}
          numberOfLines={compact ? 5 : 8}
        >
          "{text}"
        </Text>
        <View style={styles.quoteExportPreviewFooter}>
          <Text
            style={[
              styles.quoteExportPreviewSeries,
              { color: theme.foreground },
            ]}
          >
            {seriesTitle}
          </Text>
          <Text
            style={[styles.quoteExportPreviewLesson, { color: theme.muted }]}
          >
            {lessonTitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

function buildShareImageDraft(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  if (characters.length <= SHARE_IMAGE_TEXT_LIMIT) {
    return {
      text: normalized,
      originalLength: characters.length,
      truncated: false,
    };
  }

  const limit = Math.max(1, SHARE_IMAGE_TEXT_LIMIT - 3);
  const roughDraft = characters.slice(0, limit).join('').trim();
  const lastSpace = roughDraft.lastIndexOf(' ');
  const trimmed =
    lastSpace > Math.floor(limit * 0.64)
      ? roughDraft.slice(0, lastSpace).trim()
      : roughDraft;

  return {
    text: `${trimmed.replace(/[.,;:!?-]+$/g, '')}...`,
    originalLength: characters.length,
    truncated: true,
  };
}

function getShareImageFontRange(size: ShareImageSize) {
  const shortSide = Math.min(size.width, size.height);
  const minimumValue = Math.max(28, Math.round(shortSide * 0.034));
  const maximumValue = Math.max(
    minimumValue + 18,
    Math.round(shortSide * 0.086),
  );
  const defaultValue = Math.round((minimumValue + maximumValue) * 0.56);

  return {
    minimumValue,
    maximumValue,
    defaultValue,
  };
}

function clampShareImageFontSize(
  value: number,
  range: ReturnType<typeof getShareImageFontRange>,
) {
  return Math.max(range.minimumValue, Math.min(range.maximumValue, value));
}

async function saveShareImageDataUrl(dataUrl: string, fileName: string) {
  const RNFS = getRNFSModule();
  const directory = `${RNFS.CachesDirectoryPath}/share-images`;
  await RNFS.mkdir(directory);

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const targetPath = `${directory}/${fileName}`;

  if (await RNFS.exists(targetPath)) {
    await RNFS.unlink(targetPath);
  }

  await RNFS.writeFile(targetPath, base64, 'base64');
  return `file://${targetPath}`;
}

function buildShareImageCanvasHtml({
  text,
  seriesTitle,
  lessonTitle,
  size,
  theme,
  fontSize,
  minFontSize,
}: {
  text: string;
  seriesTitle: string;
  lessonTitle: string;
  size: ShareImageSize;
  theme: ShareImageTheme;
  fontSize: number;
  minFontSize: number;
}) {
  const payload = {
    text,
    seriesTitle,
    lessonTitle,
    width: size.width,
    height: size.height,
    theme,
    fontSize,
    minFontSize,
  };

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <canvas id="quote"></canvas>
    <script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        function post(message) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }
        function roundedRect(ctx, x, y, width, height, radius) {
          var r = Math.min(radius, width / 2, height / 2);
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + width, y, x + width, y + height, r);
          ctx.arcTo(x + width, y + height, x, y + height, r);
          ctx.arcTo(x, y + height, x, y, r);
          ctx.arcTo(x, y, x + width, y, r);
          ctx.closePath();
        }
        function hexToRgba(hex, alpha) {
          var value = String(hex || '#000000').replace('#', '');
          if (value.length === 3) {
            value = value.split('').map(function (part) { return part + part; }).join('');
          }
          var numberValue = parseInt(value, 16);
          var red = (numberValue >> 16) & 255;
          var green = (numberValue >> 8) & 255;
          var blue = numberValue & 255;
          return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
        }
        function wrapLines(ctx, value, maxWidth) {
          var words = String(value || '').split(/\\s+/).filter(Boolean);
          var lines = [];
          var current = '';
          words.forEach(function (word) {
            var test = current ? current + ' ' + word : word;
            if (current && ctx.measureText(test).width > maxWidth) {
              lines.push(current);
              current = word;
            } else {
              current = test;
            }
          });
          if (current) {
            lines.push(current);
          }
          return lines;
        }
        function drawLabel(ctx, text, x, y, maxWidth) {
          var output = String(text || '').toUpperCase();
          while (output.length > 3 && ctx.measureText(output).width > maxWidth) {
            output = output.slice(0, -4).trim() + '...';
          }
          ctx.fillText(output, x, y);
        }
        try {
          var canvas = document.getElementById('quote');
          canvas.width = payload.width;
          canvas.height = payload.height;
          var ctx = canvas.getContext('2d');
          var width = payload.width;
          var height = payload.height;
          var theme = payload.theme;
          var margin = Math.round(Math.min(width, height) * 0.075);
          var panelX = margin;
          var panelY = margin;
          var panelW = width - margin * 2;
          var panelH = height - margin * 2;
          var accentW = Math.max(18, Math.round(width * 0.018));
          var compact = width / height > 1.25;
          var footerH = compact ? 132 : 188;
          var topH = compact ? 104 : 132;
          var quoteMaxW = panelW - accentW - margin * 1.6;
          var quoteBudget = panelH - topH - footerH;
          var quoteFont = payload.fontSize || (compact ? 54 : height > width ? 64 : 60);
          var minimumQuoteFont = payload.minFontSize || 30;
          var quoteLines = [];
          var lineHeight = 0;

          ctx.fillStyle = theme.background;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = hexToRgba(theme.accent, 0.18);
          ctx.fillRect(width * 0.68, 0, width * 0.32, height);
          ctx.save();
          ctx.translate(width * 0.58, -height * 0.08);
          ctx.rotate(0.36);
          ctx.fillStyle = hexToRgba(theme.accent, 0.16);
          ctx.fillRect(0, 0, width * 0.18, height * 1.25);
          ctx.restore();

          roundedRect(ctx, panelX, panelY, panelW, panelH, 44);
          ctx.fillStyle = theme.panel;
          ctx.fill();
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.fillStyle = theme.accent;
          roundedRect(ctx, panelX, panelY, accentW, panelH, 44);
          ctx.fill();

          ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.letterSpacing = '4px';
          ctx.fillStyle = theme.accent;
          drawLabel(ctx, 'Jack Sequeira Ministries', panelX + margin, panelY + 62, panelW - margin * 2);
          ctx.letterSpacing = '0px';

          do {
            ctx.font = '800 ' + quoteFont + 'px Georgia, "Times New Roman", serif';
            lineHeight = Math.round(quoteFont * 1.18);
            quoteLines = wrapLines(ctx, payload.text, quoteMaxW);
            quoteFont -= 2;
          } while (quoteFont > minimumQuoteFont && quoteLines.length * lineHeight > quoteBudget);
          quoteFont += 2;
          lineHeight = Math.round(quoteFont * 1.18);
          ctx.font = '800 ' + quoteFont + 'px Georgia, "Times New Roman", serif';
          ctx.fillStyle = theme.foreground;
          var quoteY = panelY + topH + Math.max(0, (quoteBudget - quoteLines.length * lineHeight) / 2);
          quoteLines.forEach(function (line, index) {
            var prefix = index === 0 ? '"' : '';
            var suffix = index === quoteLines.length - 1 ? '"' : '';
            ctx.fillText(prefix + line + suffix, panelX + margin, quoteY + lineHeight * index);
          });

          var footerY = panelY + panelH - footerH + 30;
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(panelX + margin, footerY - 20);
          ctx.lineTo(panelX + margin + Math.min(190, panelW * 0.26), footerY - 20);
          ctx.stroke();

          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = theme.foreground;
          drawLabel(ctx, payload.seriesTitle, panelX + margin, footerY + 28, panelW - margin * 2);
          ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = theme.muted;
          drawLabel(ctx, payload.lessonTitle, panelX + margin, footerY + 72, panelW - margin * 2);
          ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = theme.muted;
          ctx.fillText('jacksequeira.org', panelX + margin, panelY + panelH - 34);

          post({ type: 'quoteExportReady', dataUrl: canvas.toDataURL('image/png') });
        } catch (error) {
          post({
            type: 'quoteExportError',
            message: error && error.message ? error.message : 'Unable to create image.',
          });
        }
      })();
      true;
    </script>
  </body>
</html>`;
}

function buildShareImageFileName({
  seriesTitle,
  lessonTitle,
  size,
}: {
  seriesTitle: string;
  lessonTitle: string;
  size: ShareImageSize;
}) {
  const source = sanitizeFileName(`${seriesTitle}-${lessonTitle}`)
    .slice(0, 72)
    .replace(/-+$/g, '');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/T/, '_')
    .replace(/Z$/, '');
  return `${source || 'jack-sequeira-quote'}-${size.id.replace(
    ':',
    'x',
  )}-${timestamp}.png`;
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getShareImageModule(): ShareImageModule {
  if (!NativeModules.RNShare) {
    throw new Error(
      'Image sharing is not available in this build. Rebuild the app and try again.',
    );
  }

  const imported = require('react-native-share') as ShareImageModule & {
    default?: ShareImageModule;
  };
  return imported.default ?? imported;
}

function getRNFSModule(): RNFSModule {
  if (!NativeModules.RNFSManager) {
    throw new Error(
      'Image file naming is not available in this build. Rebuild the app and try again.',
    );
  }

  const imported = require('react-native-fs') as RNFSModule & {
    default?: RNFSModule;
  };
  return imported.default ?? imported;
}

function InlineNoteEditorModal({
  visible,
  styles,
  palette,
  selection,
  value,
  canSave,
  onChangeValue,
  onSave,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  selection: TextSelection | null;
  value: string;
  canSave: boolean;
  onChangeValue: (value: string) => void;
  onSave: () => void;
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
        <View style={styles.inlineNoteModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Inline note</Text>
              <Text style={styles.inlineNoteSelectedText} numberOfLines={3}>
                {selection?.text ?? ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close note"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>×</Text>
            </Pressable>
          </View>
          <TextInput
            multiline
            autoFocus
            scrollEnabled
            placeholder="Write your note..."
            placeholderTextColor={palette.muted}
            value={value}
            onChangeText={onChangeValue}
            style={styles.inlineNoteInput}
            textAlignVertical="top"
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={onSave}
            style={[
              styles.inlineNoteSaveButton,
              { backgroundColor: palette.primarySolid },
              !canSave && styles.inlineNoteSaveButtonDisabled,
            ]}
          >
            <Text style={styles.inlineNoteSaveButtonText}>Save note</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InlineNoteViewModal({
  visible,
  styles,
  highlight,
  onEdit,
  onClose,
}: {
  visible: boolean;
  styles: AppStyles;
  palette: AppPalette;
  highlight: LessonHighlight | null;
  onEdit: (highlight: LessonHighlight) => void;
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
        <View style={styles.inlineNoteModalCard}>
          <View style={styles.bibleModalHeader}>
            <View style={styles.bibleModalHeaderText}>
              <Text style={styles.bibleModalEyebrow}>Your note</Text>
              <Text style={styles.inlineNoteSelectedText} numberOfLines={3}>
                {highlight?.text ?? ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close note"
              onPress={onClose}
              style={styles.bibleModalCloseButton}
            >
              <Text style={styles.bibleModalCloseText}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.inlineNoteBodyScroll}
            contentContainerStyle={styles.inlineNoteBodyScrollContent}
          >
            <Text style={styles.inlineNoteBody}>{highlight?.note ?? ''}</Text>
          </ScrollView>
          <View style={styles.inlineNoteActionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!highlight}
              onPress={() => {
                if (highlight) {
                  onEdit(highlight);
                }
              }}
              style={[
                styles.inlineNoteSecondaryButton,
                !highlight && styles.inlineNoteSaveButtonDisabled,
              ]}
            >
              <Text style={styles.inlineNoteSecondaryButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.inlineNoteDoneButton}
            >
              <Text style={styles.inlineNoteDoneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
