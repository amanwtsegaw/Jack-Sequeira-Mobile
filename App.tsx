import { isNetworkPlaybackError } from './src/services/playbackService';
import { selectFeaturedSeries } from './src/services/homeContent';
import { AppText as Text } from './src/typography';
import { TypographyProvider } from './src/typography';
import { LoadingSkeleton } from './src/app/components/LoadingSkeleton';
import { blocksToPlainText } from './src/content/schema';
import { StudyRoomScreen } from './src/app/screens/StudyRoomScreen';
import { initialStudyRoomCourse } from './src/data/studyRoom';
import {
  mergePublishedCatalog,
  retainUnchangedLesson,
  sameContent,
} from './src/services/contentSync';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  AppState,
  Alert,
  Easing,
  Image,
  ImageBackground,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  View,
} from 'react-native';
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  fontScaleOptions,
  isEthiopicLanguage,
  getStepValue,
  lineHeightOptions,
  palettes,
  resolveAppTypography,
  type FontChoice,
  type ReadingLanguage,
} from './src/design';
import {
  getAdjacentLessons,
  getLessonForReadingLanguage,
  getLessonBySlug,
  getSeriesBySlug,
  getTopSeries,
  type ArchiveLesson,
  type ArchiveSeries,
} from './src/data/archive';
import {
  fetchRemoteBibleStudyCourse,
  fetchRemoteLesson,
  fetchRemoteMediaCatalog,
  fetchRemoteSeries,
  fetchRemoteSeriesCatalog,
  getRemoteApiLanguage,
  isRemoteReadingLanguage,
} from './src/services/remoteContentService';
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
  getRemoteCacheByteSize,
  getDownloadedAudioByteSize,
  type LessonHighlight,
  type ReaderSettings,
  type StorageState,
} from './src/storage';
import {
  deleteDownloadedAudio,
  downloadAudioTrack,
  getAudioTrackId,
} from './src/services/audioDownloadService';
import { getStaticText } from './src/i18n/staticText';
import {
  audioCollections as bundledAudioCollections,
  videoCollections as bundledVideoCollections,
  type AudioTrack,
} from './src/data/media';
import {
  isReadRoute,
  type ReadSection,
  type Route,
  type SearchScope,
  type TabKey,
} from './src/app/navigation';
import { createStyles, type AppStyles } from './src/app/styles';
import {
  BackgroundGlow,
  BottomTabs,
  GlobalAudioMiniPlayer,
} from './src/app/components/Chrome';
import { AudioFullscreenPlayerModal } from './src/app/components/MediaPlayer';
import { ReaderControlsSheet } from './src/app/components/ReaderControlsSheet';
import {
  AudioLibraryScreen,
  AboutScreen,
  HomeScreen,
  LibraryScreen,
  LessonScreen,
  MissingState,
  SavedScreen,
  SeriesScreen,
  SettingsScreen,
  VideoLibraryScreen,
} from './src/app/screens';

const { SystemBars } = NativeModules as {
  SystemBars?: {
    setNavigationBarColor: (color: string, useDarkIcons: boolean) => void;
  };
};
const splashLogo = require('./src/logo/Jack Sequeira Logo-01.png');
const splashLeather = require('./src/assets/images/splash-leather.png');
const onboardingGrowFaithScreenshot = require('./src/assets/images/1. Grow your faith.png');
const onboardingStudiesScreenshot = require('./src/assets/images/2. Multiple Studies.png');
const onboardingAudioScreenshot = require('./src/assets/images/3. Audio Archives.png');
const onboardingVideoScreenshot = require('./src/assets/images/4. Video Archives.png');
const onboardingThemesScreenshot = require('./src/assets/images/5. Multiple Themes.png');
const onboardingFontsScreenshot = require('./src/assets/images/6. Font preferences.png');
const onboardingHighlightsScreenshot = require('./src/assets/images/7. Highilghting..png');
const splashBackgroundColor = '#1E1040';

const onboardingSlides = [
  {
    eyebrow: 'Grow Your Faith',
    title: 'Begin with a focused faith-building archive.',
    body: 'Open a calm space for Scripture-centered reading, teaching, and reflection wherever you are.',
    accent: 'Archive',
    previewTitle: 'Jack Sequeira Archive',
    previewLines: ['Studies', 'Audio messages', 'Video teachings'],
    image: onboardingGrowFaithScreenshot,
  },
  {
    eyebrow: 'Multiple Studies',
    title: 'Explore organized study collections.',
    body: 'Move through topical series, Bible courses, and lesson groups without losing your place.',
    accent: 'Read',
    previewTitle: 'Published Study Series',
    previewLines: ['Topical Studies', 'Bible Study Courses', 'Lesson lists'],
    image: onboardingStudiesScreenshot,
  },
  {
    eyebrow: 'Audio Archives',
    title: 'Listen to messages inside the app.',
    body: 'Browse audio collections, control playback, adjust speed, and continue listening while you navigate.',
    accent: 'Audio',
    previewTitle: 'Audio Library',
    previewLines: ['Collections', 'Playback speed', 'Mini player'],
    image: onboardingAudioScreenshot,
  },
  {
    eyebrow: 'Video Archives',
    title: 'Watch teaching sessions when reading is not enough.',
    body: 'Use the video library to revisit messages in a visual format alongside the reading and audio archive.',
    accent: 'Video',
    previewTitle: 'Video Library',
    previewLines: ['Featured messages', 'Archive videos', 'Focused playback'],
    image: onboardingVideoScreenshot,
  },
  {
    eyebrow: 'Multiple Themes',
    title: 'Choose the reading mood that fits the moment.',
    body: 'Switch between theme styles so the app feels comfortable in bright light, low light, or long study sessions.',
    accent: 'Theme',
    previewTitle: 'Theme',
    previewLines: ['Dark', 'Sepia', 'Light'],
    image: onboardingThemesScreenshot,
  },
  {
    eyebrow: 'Font Preferences',
    title: 'Shape the reader around your eyes.',
    body: 'Select the reading font you prefer, then fine-tune text size and line height for steady reading.',
    accent: 'Aa',
    previewTitle: 'Reading Font',
    previewLines: ['Original', 'Cabin', 'Lexend'],
    image: onboardingFontsScreenshot,
  },
  {
    eyebrow: 'Highlighting',
    title: 'Mark what matters and return to it later.',
    body: 'Highlight key passages, save lessons, and keep your study work connected to the text.',
    accent: 'Saved',
    previewTitle: 'Highlights',
    previewLines: ['Mark text', 'Save lessons', 'Review notes'],
    image: onboardingHighlightsScreenshot,
  },
] as const;

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ArchiveApp />
    </SafeAreaProvider>
  );
}

function ArchiveApp() {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [routeHistory, setRouteHistory] = useState<Route[]>([]);
  const [storage, setStorage] = useState<StorageState>(defaultStorageState);
  const [hydrated, setHydrated] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SearchScope | null>(null);
  const [readerSheetOpen, setReaderSheetOpen] = useState(false);
  const [readerChromeHidden, setReaderChromeHidden] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [audioQuery] = useState('');
  const [videoQuery] = useState('');
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState<
    Record<string, number>
  >({});
  const [miniPlayerMinimized, setMiniPlayerMinimized] = useState(false);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [catalogPending, setCatalogPending] = useState(true);
  const [mediaPending, setMediaPending] = useState(true);
  const [readerFetch, setReaderFetch] = useState<{
    key: string;
    loading: boolean;
    failed: boolean;
  } | null>(null);
  const [syncRevision, setSyncRevision] = useState(0);
  const remoteSeriesRef = useRef<ArchiveSeries[]>([]);
  const [bibleStudyCourse, setBibleStudyCourse] = useState(
    initialStudyRoomCourse,
  );
  const [remoteSeries, setRemoteSeries] = useState<ArchiveSeries[]>([]);
  const [remoteLessons, setRemoteLessons] = useState<
    Record<string, ArchiveLesson>
  >({});
  const [audioCollections, setAudioCollections] = useState(
    bundledAudioCollections,
  );
  const [videoCollections, setVideoCollections] = useState(
    bundledVideoCollections,
  );
  remoteSeriesRef.current = remoteSeries;
  const lastReadRouteRef = useRef<Route>({ name: 'library' });
  const remoteCacheRef = useRef(storage.remoteCache);
  const routeTransition = useRef(new Animated.Value(1)).current;
  const bottomTabsVisibility = useRef(new Animated.Value(1)).current;
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const miniPlayerProgress = useProgress(250);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const value = await loadStorageState();
      if (active) {
        setStorage(value);
        setHydrated(true);
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      const saveTimer = setTimeout(() => {
        saveStorageState(storage);
      }, 350);
      return () => clearTimeout(saveTimer);
    }
  }, [hydrated, storage]);

  useEffect(() => {
    remoteCacheRef.current = storage.remoteCache;
  }, [storage.remoteCache]);

  useEffect(() => {
    if (isRememberableReadRoute(route)) {
      lastReadRouteRef.current = route;
    }
  }, [route]);

  const routeKey = getRouteKey(route);

  useEffect(() => {
    routeTransition.setValue(0);
    setReaderChromeHidden(false);
    Animated.timing(routeTransition, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [routeKey, routeTransition]);

  useEffect(() => {
    Animated.timing(bottomTabsVisibility, {
      toValue: route.name === 'lesson' && readerChromeHidden ? 0 : 1,
      duration: readerChromeHidden ? 220 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bottomTabsVisibility, readerChromeHidden, route.name]);

  useEffect(() => {
    if (!activeTrack) {
      return;
    }

    TrackPlayer.setRate(audioPlaybackRate).catch(() => undefined);
  }, [activeTrack, activeTrack?.id, audioPlaybackRate]);

  useEffect(() => {
    setMiniPlayerMinimized(false);
  }, [activeTrack?.id]);

  const cacheRemoteCatalog = useCallback(
    (language: ReadingLanguage, series: ArchiveSeries[]) => {
      setStorage(current => ({
        ...current,
        remoteCache: {
          ...current.remoteCache,
          updatedAt: new Date().toISOString(),
          seriesCatalogs: {
            ...current.remoteCache.seriesCatalogs,
            [language]: series,
          },
        },
      }));
    },
    [],
  );

  const cacheRemoteSeries = useCallback(
    (cacheKey: string, series: ArchiveSeries) => {
      setStorage(current => ({
        ...current,
        remoteCache: {
          ...current.remoteCache,
          updatedAt: new Date().toISOString(),
          series: {
            ...current.remoteCache.series,
            [cacheKey]: series,
          },
        },
      }));
    },
    [],
  );

  const cacheRemoteLesson = useCallback(
    (cacheKey: string, lesson: ArchiveLesson) => {
      setStorage(current => ({
        ...current,
        remoteCache: {
          ...current.remoteCache,
          updatedAt: new Date().toISOString(),
          lessons: {
            ...current.remoteCache.lessons,
            [cacheKey]: lesson,
          },
        },
      }));
    },
    [],
  );

  // Refresh silently on launch, foreground, and while online. Cached content stays usable offline.
  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    let refreshing = false;
    const language = storage.readerSettings.readingLanguage;
    const cache = remoteCacheRef.current;
    setCatalogPending(
      !cache.seriesCatalogs[language] &&
        getLocalFallbackSeries(language).length === 0,
    );
    setRemoteSeries(
      cache.seriesCatalogs[language] ?? getLocalFallbackSeries(language),
    );
    setRemoteLessons(
      Object.fromEntries(
        Object.entries(cache.lessons).filter(([key]) =>
          key.startsWith(`${getRemoteApiLanguage(language)}:`),
        ),
      ),
    );
    setBibleStudyCourse(cache.bibleStudyCourse ?? initialStudyRoomCourse);
    if (cache.audioCollections.length)
      setAudioCollections(cache.audioCollections);
    if (cache.videoCollections.length)
      setVideoCollections(cache.videoCollections);

    async function refresh() {
      if (!active || refreshing || AppState.currentState === 'background')
        return;
      refreshing = true;
      await Promise.allSettled([
        fetchRemoteSeriesCatalog(language)
          .then(published => {
            if (!active) return;
            const next = mergePublishedCatalog(
              published,
              remoteSeriesRef.current,
            );
            setRemoteSeries(current =>
              sameContent(current, next) ? current : next,
            );
            if (
              !sameContent(
                remoteCacheRef.current.seriesCatalogs[language],
                next,
              )
            )
              cacheRemoteCatalog(language, next);
          })
          .finally(() => {
            if (active) setCatalogPending(false);
          }),
        fetchRemoteMediaCatalog()
          .then(media => {
            if (!active) return;
            setAudioCollections(current =>
              sameContent(current, media.audioCollections)
                ? current
                : media.audioCollections,
            );
            setVideoCollections(current =>
              sameContent(current, media.videoCollections)
                ? current
                : media.videoCollections,
            );
            setStorage(current => {
              if (
                sameContent(
                  current.remoteCache.audioCollections,
                  media.audioCollections,
                ) &&
                sameContent(
                  current.remoteCache.videoCollections,
                  media.videoCollections,
                )
              )
                return current;
              return {
                ...current,
                remoteCache: {
                  ...current.remoteCache,
                  updatedAt: media.generatedAt,
                  audioCollections: media.audioCollections,
                  videoCollections: media.videoCollections,
                },
              };
            });
          })
          .finally(() => {
            if (active) setMediaPending(false);
          }),
        fetchRemoteBibleStudyCourse().then(course => {
          if (!active) return;
          setBibleStudyCourse(current =>
            sameContent(
              { ...current, generatedAt: '' },
              { ...course, generatedAt: '' },
            )
              ? current
              : course,
          );
          setStorage(current => {
            if (
              sameContent(
                { ...current.remoteCache.bibleStudyCourse, generatedAt: '' },
                { ...course, generatedAt: '' },
              )
            )
              return current;
            return {
              ...current,
              remoteCache: {
                ...current.remoteCache,
                updatedAt: course.generatedAt,
                bibleStudyCourse: course,
              },
            };
          });
        }),
      ]);
      refreshing = false;
      if (active) setSyncRevision(value => value + 1);
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [hydrated, storage.readerSettings.readingLanguage, cacheRemoteCatalog]);

  const remoteRouteSeriesSlug =
    route.name === 'series' || route.name === 'lesson'
      ? route.seriesSlug
      : null;
  const remoteRouteLessonSlug =
    route.name === 'lesson' ? route.lessonSlug : null;
  useEffect(() => {
    if (!hydrated || !remoteRouteSeriesSlug) return;
    let active = true;
    const language = storage.readerSettings.readingLanguage;
    const seriesKey = buildRemoteSeriesCacheKey(
      language,
      remoteRouteSeriesSlug,
    );
    const cachedSeries = remoteCacheRef.current.series[seriesKey];
    if (cachedSeries)
      setRemoteSeries(current =>
        current.some(
          item => item.slug === cachedSeries.slug && item.lessons.length > 0,
        )
          ? current
          : mergeRemoteSeries(current, cachedSeries),
      );
    const lessonKey = remoteRouteLessonSlug
      ? buildRemoteLessonKey(language, remoteRouteLessonSlug)
      : null;
    const cachedLesson = lessonKey
      ? remoteCacheRef.current.lessons[lessonKey]
      : null;
    if (cachedLesson && lessonKey)
      setRemoteLessons(current =>
        current[lessonKey]
          ? current
          : { ...current, [lessonKey]: cachedLesson },
      );

    const requestKey = `${language}:${remoteRouteSeriesSlug}:${
      remoteRouteLessonSlug ?? ''
    }`;
    setReaderFetch({ key: requestKey, loading: true, failed: false });
    async function refreshReader() {
      let succeeded = false;
      try {
        const series = await fetchRemoteSeries(
          remoteRouteSeriesSlug!,
          language,
        );
        if (!active) return;
        const previous = remoteSeriesRef.current.find(
          item =>
            item.slug === series.slug &&
            isSameReadingLanguage(item.language, language),
        );
        const classified = previous
          ? {
              ...series,
              category: previous.category,
              categoryLabel: previous.categoryLabel,
            }
          : series;
        const merged = mergePublishedCatalog(
          [classified],
          previous ? [previous] : [],
        )[0];
        setRemoteSeries(current =>
          sameContent(
            current.find(item => item.slug === merged.slug),
            merged,
          )
            ? current
            : mergeRemoteSeries(current, merged),
        );
        if (!sameContent(remoteCacheRef.current.series[seriesKey], merged))
          cacheRemoteSeries(seriesKey, merged);
        if (!remoteRouteLessonSlug || !lessonKey) {
          succeeded = true;
          return;
        }
        const lesson = await fetchRemoteLesson({
          lessonSlug: remoteRouteLessonSlug,
          series: merged,
          language,
        });
        if (!active) return;
        setRemoteLessons(current => {
          const next = retainUnchangedLesson(current[lessonKey!], lesson);
          return next === current[lessonKey!]
            ? current
            : { ...current, [lessonKey!]: next };
        });
        if (!sameContent(remoteCacheRef.current.lessons[lessonKey], lesson))
          cacheRemoteLesson(lessonKey, lesson);
        setRemoteSeries(current =>
          current.map(item => {
            if (
              item.slug !== merged.slug ||
              !isSameReadingLanguage(item.language, language)
            )
              return item;
            const lessons = item.lessons.map(existing =>
              existing.slug === lesson.slug
                ? retainUnchangedLesson(existing, lesson)
                : existing,
            );
            return lessons.every(
              (value, index) => value === item.lessons[index],
            )
              ? item
              : { ...item, lessons };
          }),
        );
        succeeded = true;
      } catch {
        // Keep the last successful content while offline; retry on the next sync.
      } finally {
        if (active)
          setReaderFetch({
            key: requestKey,
            loading: false,
            failed: !succeeded,
          });
      }
    }
    void refreshReader();
    return () => {
      active = false;
    };
  }, [
    hydrated,
    remoteRouteSeriesSlug,
    remoteRouteLessonSlug,
    storage.readerSettings.readingLanguage,
    syncRevision,
    cacheRemoteSeries,
    cacheRemoteLesson,
  ]);

  useEffect(() => {
    if (!isReadRoute(route)) {
      return;
    }

    const readingLanguage = storage.readerSettings.readingLanguage;
    if (usesAdminSyncedContent(readingLanguage)) {
      if (route.name === 'lesson') {
        const series = remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(item.language, readingLanguage),
        );
        const lesson = getDisplayLesson(
          getRemoteLessonForRoute(
            remoteLessons,
            series ?? null,
            readingLanguage,
            route.lessonSlug,
          ),
          route.lessonSlug,
          readingLanguage,
        );
        if (
          !lesson ||
          (!series &&
            !getLocalFallbackSeriesBySlug(route.seriesSlug, readingLanguage))
        ) {
          closeTransientUi();
          setRouteHistory([]);
          replaceRoute({ name: 'library' });
        }
      }

      if (route.name === 'series') {
        const series = remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(item.language, readingLanguage),
        );
        if (
          remoteSeries.length > 0 &&
          !series &&
          !getLocalFallbackSeriesBySlug(route.seriesSlug, readingLanguage)
        ) {
          closeTransientUi();
          setRouteHistory([]);
          replaceRoute({ name: 'library' });
        }
      }
      return;
    }

    if (route.name === 'lesson') {
      const lesson = getLessonBySlug(route.lessonSlug);
      if (!lesson || lesson.language !== readingLanguage) {
        closeTransientUi();
        setRouteHistory([]);
        replaceRoute({ name: 'library' });
      }
      return;
    }

    if (route.name === 'series') {
      const series = getSeriesBySlug(route.seriesSlug);
      if (!series || series.language !== readingLanguage) {
        closeTransientUi();
        setRouteHistory([]);
        replaceRoute({ name: 'library' });
      }
    }
  }, [
    route,
    remoteLessons,
    remoteSeries,
    storage.readerSettings.readingLanguage,
  ]);

  const palette = palettes[storage.readerSettings.themeMode];
  const typography = useMemo(
    () =>
      resolveAppTypography(
        storage.readerSettings.fontChoice,
        storage.readerSettings.readingLanguage,
      ),
    [storage.readerSettings.fontChoice, storage.readerSettings.readingLanguage],
  );
  const staticText = getStaticText(storage.readerSettings.readingLanguage);
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const isIPadLandscape =
    isIPad && windowDimensions.width > windowDimensions.height;
  const styles = useMemo(
    () =>
      createStyles(palette, typography, {
        isIPad,
        isIPadLandscape,
      }),
    [palette, typography, isIPad, isIPadLandscape],
  );
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const featuredVideo =
    videoCollections.flatMap(collection => collection.items)[0] ?? null;
  const showOnboarding =
    hydrated && !storage.hasSeenOnboarding && !splashVisible;
  const bottomChromeOffset =
    Platform.OS === 'android'
      ? insets.bottom > 12
        ? insets.bottom + 6
        : 6
      : Math.min(insets.bottom, 10);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backgroundColor = splashVisible
      ? splashBackgroundColor
      : palette.background;
    SystemBars?.setNavigationBarColor(
      backgroundColor,
      !splashVisible && palette.statusBar === 'dark-content',
    );
  }, [palette.background, palette.statusBar, splashVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setSplashVisible(false));
    }, 3000);

    return () => clearTimeout(timer);
  }, [splashOpacity]);

  const activeReadingLanguage = storage.readerSettings.readingLanguage;
  const topSeries = getDisplaySeriesList(
    remoteSeries.filter(series =>
      isSameReadingLanguage(series.language, activeReadingLanguage),
    ),
    activeReadingLanguage,
  );

  const featuredSeries = selectFeaturedSeries(topSeries);
  const featuredAudioCollections = audioCollections.map(collection => ({
    ...collection,
    tracks: collection.tracks.slice(0, 3),
  }));
  const activeLessonsBySlug = new Map(
    topSeries.flatMap(series =>
      series.lessons.map(lesson => [lesson.slug, lesson] as const),
    ),
  );

  const continueReadingItems = storage.recents
    .map(itemKey => {
      const { slug, language } = parseStoredLessonKey(itemKey);
      if (
        language !== activeReadingLanguage &&
        !(language === null && activeReadingLanguage === 'en')
      )
        return null;
      const progress =
        storage.progress[buildStoredLessonKey(activeReadingLanguage, slug)] ??
        (activeReadingLanguage === 'en' ? storage.progress[slug] : undefined);
      if (!progress || progress.ratio <= 0 || progress.ratio >= 1) return null;
      const lesson = activeLessonsBySlug.get(slug);
      if (!lesson) {
        return null;
      }
      return {
        lesson,
        progress,
      };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;

  const favoriteLessons = storage.favorites
    .map(itemKey => {
      const { slug } = parseStoredLessonKey(itemKey);
      return activeLessonsBySlug.get(slug) ?? getLessonBySlug(slug) ?? null;
    })
    .filter((lesson, index, lessons): lesson is ArchiveLesson => {
      if (!lesson) {
        return false;
      }
      return lessons.findIndex(item => item?.slug === lesson.slug) === index;
    });

  const highlightEntries = Object.entries(storage.highlights ?? {})
    .flatMap(([lessonKey, highlights]) => {
      const { slug: lessonSlug } = parseStoredLessonKey(lessonKey);
      const lesson =
        activeLessonsBySlug.get(lessonSlug) ?? getLessonBySlug(lessonSlug);

      if (!lesson) {
        return [];
      }

      return highlights.map(highlight => ({
        lessonSlug,
        lesson,
        highlight: {
          ...highlight,
          text: getTranslatedHighlightText(highlight, lesson),
        },
      }));
    })
    .sort((left, right) =>
      right.highlight.createdAt.localeCompare(left.highlight.createdAt),
    );

  const groupedNotes = Object.entries(storage.notes ?? {})
    .filter(([, value]) => value.trim().length > 0)
    .map(([lessonKey, value]) => {
      const { slug: lessonSlug } = parseStoredLessonKey(lessonKey);
      return {
        id: `${lessonKey}:lesson-note`,
        lessonSlug,
        lesson:
          activeLessonsBySlug.get(lessonSlug) ?? getLessonBySlug(lessonSlug),
        value,
        text: '',
      };
    })
    .filter(entry => entry.lesson)
    .concat(
      highlightEntries
        .filter(entry => entry.highlight.note?.trim())
        .map(entry => ({
          id: entry.highlight.id,
          lessonSlug: entry.lessonSlug,
          lesson: entry.lesson,
          value: entry.highlight.note ?? '',
          text: entry.highlight.text,
        })),
    )
    .sort((left, right) => left.lessonSlug.localeCompare(right.lessonSlug));

  const savedSummary = {
    favorites: favoriteLessons.length,
    highlights: highlightEntries.length,
    notes: groupedNotes.length,
  };
  const cacheSummary = {
    bytes: getRemoteCacheByteSize(storage.remoteCache),
    catalogCount: Object.values(storage.remoteCache.seriesCatalogs).reduce(
      (sum, series) => sum + (series?.length ?? 0),
      0,
    ),
    seriesCount: Object.keys(storage.remoteCache.series).length,
    lessonCount: Object.keys(storage.remoteCache.lessons).length,
    updatedAt: storage.remoteCache.updatedAt,
  };
  const downloadedAudioSummary = {
    bytes: getDownloadedAudioByteSize(storage.downloadedAudio),
    count: Object.keys(storage.downloadedAudio).length,
  };
  const previousRoute = routeHistory[routeHistory.length - 1] ?? null;
  const canGoBack = Boolean(previousRoute);

  function closeTransientUi() {
    setActiveSearch(null);
    setReaderSheetOpen(false);
  }

  function completeOnboarding() {
    setStorage(current => ({
      ...current,
      hasSeenOnboarding: true,
    }));
  }

  function navigateTo(nextRoute: Route, options?: { replace?: boolean }) {
    if (routesEqual(route, nextRoute)) {
      return;
    }

    if (!options?.replace) {
      setRouteHistory(current => [...current, route].slice(-40));
    }
    setRoute(nextRoute);
  }

  function replaceRoute(nextRoute: Route) {
    setRoute(nextRoute);
  }

  function switchTab(nextRoute: Route) {
    if (routesEqual(route, nextRoute)) {
      return;
    }

    setRouteHistory([]);
    setRoute(nextRoute);
  }

  function selectTab(tab: TabKey) {
    closeTransientUi();
    switch (tab) {
      case 'home':
        switchTab({ name: 'home' });
        return;
      case 'library':
        switchToRememberedLibraryRoute();
        return;
      case 'audio':
        setMiniPlayerMinimized(false);
        switchTab({ name: 'audio' });
        return;
      case 'video':
        switchTab({ name: 'video' });
        return;
      case 'settings':
        switchTab({ name: 'settings' });
        return;
    }
  }

  function switchToRememberedLibraryRoute() {
    const rememberedRoute = getRememberedLibraryRoute(lastReadRouteRef.current);
    if (routesEqual(route, rememberedRoute)) {
      return;
    }

    setRouteHistory(buildReadRouteHistory(rememberedRoute));
    setRoute(rememberedRoute);
  }

  function openSeries(seriesSlug: string) {
    closeTransientUi();
    if (route.name === 'home') {
      setRouteHistory([
        { name: 'library', section: getLibrarySectionForSeries(seriesSlug) },
      ]);
      setRoute({ name: 'series', seriesSlug });
      return;
    }

    navigateTo({ name: 'series', seriesSlug });
  }

  function getLibrarySectionForSeries(seriesSlug: string): ReadSection {
    const series =
      topSeries.find(item => item.slug === seriesSlug) ??
      getSeriesBySlug(seriesSlug);

    return series?.category === 'bible-study'
      ? 'bible-courses'
      : 'study-materials';
  }

  function openLesson(
    seriesSlug: string,
    lessonSlug: string,
    options?: {
      replace?: boolean;
      searchQuery?: string;
      librarySection?: ReadSection;
    },
  ) {
    setStorage(current => ({
      ...current,
      recents: [
        lessonSlug,
        ...current.recents.filter(slug => slug !== lessonSlug),
      ].slice(0, 10),
    }));
    closeTransientUi();

    const lessonRoute: Route = {
      name: 'lesson',
      seriesSlug,
      lessonSlug,
      searchQuery: options?.searchQuery,
      searchNonce: options?.searchQuery ? Date.now() : undefined,
    };
    if (
      options?.replace ||
      (route.name === 'series' && route.seriesSlug === seriesSlug)
    ) {
      navigateTo(lessonRoute, options);
      return;
    }

    const libraryOriginRoute: Route = {
      name: 'library',
      section:
        options?.librarySection ?? getLibrarySectionForSeries(seriesSlug),
    };
    const originRoute: Route =
      route.name === 'home'
        ? libraryOriginRoute
        : route.name === 'library'
        ? {
            name: 'library',
            section: options?.librarySection ?? route.section,
          }
        : route;
    const seriesRoute: Route = { name: 'series', seriesSlug };
    const baseHistory =
      route.name === 'home' || route.name === 'library' ? [] : routeHistory;
    const nextHistory = [...baseHistory, originRoute, seriesRoute].filter(
      (historyRoute, index, historyRoutes) =>
        index === 0 || !routesEqual(historyRoutes[index - 1], historyRoute),
    );
    setRouteHistory(nextHistory.slice(-40));
    setRoute(lessonRoute);
  }

  function openSaved() {
    closeTransientUi();
    navigateTo({ name: 'saved' });
  }

  function openSettings(fromCurrentRoute = true) {
    closeTransientUi();
    navigateTo({ name: 'settings' }, { replace: !fromCurrentRoute });
  }

  function goBack() {
    closeTransientUi();
    if (routeHistory.length > 0) {
      const previous = routeHistory[routeHistory.length - 1];
      setRouteHistory(current => current.slice(0, -1));
      setRoute(previous);
      return;
    }

    if (route.name !== 'home') {
      setRoute({ name: 'home' });
    }
  }

  function updateReaderSettings(nextSettings: Partial<ReaderSettings>) {
    setStorage(current => {
      const nextStorage = {
        ...current,
        readerSettings: {
          ...current.readerSettings,
          ...nextSettings,
        },
      };
      saveStorageState(nextStorage);
      return nextStorage;
    });
  }

  function updateThemeMode(themeMode: ReaderSettings['themeMode']) {
    updateReaderSettings({ themeMode });
  }

  function updateFontChoice(fontChoice: FontChoice) {
    updateReaderSettings({
      fontChoice,
      ...(isEthiopicLanguage(storage.readerSettings.readingLanguage)
        ? { ethiopicFontChoice: fontChoice as 'menbere' | 'nokia' }
        : { latinFontChoice: fontChoice }),
    });
  }

  function updateReadingLanguage(readingLanguage: ReadingLanguage) {
    if (storage.readerSettings.readingLanguage === readingLanguage) {
      return;
    }

    updateReaderSettings({
      readingLanguage,
      fontChoice: isEthiopicLanguage(readingLanguage)
        ? storage.readerSettings.ethiopicFontChoice ?? 'menbere'
        : storage.readerSettings.latinFontChoice ?? 'cabin',
    });
    closeTransientUi();
    setRouteHistory([]);
    replaceRoute({ name: 'home' });
  }

  function updateFontScaleByIndex(index: number) {
    updateReaderSettings({
      fontScale: getStepValue(
        fontScaleOptions,
        index,
      ) as ReaderSettings['fontScale'],
    });
  }

  function updateLineHeightByIndex(index: number) {
    updateReaderSettings({
      lineHeight: getStepValue(
        lineHeightOptions,
        index,
      ) as ReaderSettings['lineHeight'],
    });
  }

  function bumpFontScale(direction: -1 | 1) {
    const currentIndex = fontScaleOptions.findIndex(
      option => option === storage.readerSettings.fontScale,
    );
    updateFontScaleByIndex(currentIndex + direction);
  }

  function bumpLineHeight(direction: -1 | 1) {
    const currentIndex = lineHeightOptions.findIndex(
      option => option === storage.readerSettings.lineHeight,
    );
    updateLineHeightByIndex(currentIndex + direction);
  }

  async function downloadAudio(collectionKey: string, track: AudioTrack) {
    const trackId = getAudioTrackId(collectionKey, track.fileName);
    if (audioDownloadProgress[trackId] !== undefined) {
      return;
    }

    setAudioDownloadProgress(current => ({
      ...current,
      [trackId]: 0.02,
    }));

    try {
      const item = await downloadAudioTrack({
        collectionKey,
        track,
        onProgress: value => {
          setAudioDownloadProgress(current => ({
            ...current,
            [trackId]: Math.max(0.02, Math.min(0.99, value)),
          }));
        },
      });
      setStorage(current => ({
        ...current,
        downloadedAudio: {
          ...current.downloadedAudio,
          [item.id]: item,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to download this audio. Check your connection and try again.';
      Alert.alert('Download failed', message);
    } finally {
      setAudioDownloadProgress(current => {
        const next = { ...current };
        delete next[trackId];
        return next;
      });
    }
  }

  function confirmDeleteAudio(trackId: string) {
    const item = storage.downloadedAudio[trackId];
    if (!item) {
      return;
    }

    Alert.alert(
      'Delete downloaded audio?',
      `"${item.title}" will be removed from this phone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDownloadedAudio(item.localPath).catch(() => undefined);
            setStorage(current => {
              const nextDownloadedAudio = { ...current.downloadedAudio };
              delete nextDownloadedAudio[trackId];
              return {
                ...current,
                downloadedAudio: nextDownloadedAudio,
              };
            });
          },
        },
      ],
    );
  }

  function toggleFavorite(lessonSlug: string) {
    setStorage(current => {
      const lessonKey = buildStoredLessonKey(
        current.readerSettings.readingLanguage,
        lessonSlug,
      );
      const exists = current.favorites.some(
        item => parseStoredLessonKey(item).slug === lessonSlug,
      );
      return {
        ...current,
        favorites: exists
          ? current.favorites.filter(
              item => parseStoredLessonKey(item).slug !== lessonSlug,
            )
          : [lessonKey, ...current.favorites],
      };
    });
  }

  function saveHighlight(
    lessonSlug: string,
    nextHighlight: {
      id: string;
      text: string;
      color?: string;
      style?: 'highlight' | 'underline';
      note?: string;
    },
  ) {
    setStorage(current => {
      const lessonKey = buildStoredLessonKey(
        current.readerSettings.readingLanguage,
        lessonSlug,
      );
      const lessonHighlights = getStoredHighlights(
        current.highlights,
        lessonSlug,
        current.readerSettings.readingLanguage,
      );
      const existing = lessonHighlights.find(
        item => item.id === nextHighlight.id,
      );
      const savedHighlight = {
        ...existing,
        ...nextHighlight,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      return {
        ...current,
        highlights: {
          ...current.highlights,
          [lessonKey]: existing
            ? lessonHighlights.map(item =>
                item.id === nextHighlight.id ? savedHighlight : item,
              )
            : [savedHighlight, ...lessonHighlights],
        },
      };
    });
  }

  function clearHighlight(lessonSlug: string, highlightId: string) {
    setStorage(current => {
      const lessonKey = buildStoredLessonKey(
        current.readerSettings.readingLanguage,
        lessonSlug,
      );
      const lessonHighlights = getStoredHighlights(
        current.highlights,
        lessonSlug,
        current.readerSettings.readingLanguage,
      );

      return {
        ...current,
        highlights: {
          ...current.highlights,
          [lessonKey]: lessonHighlights.filter(item => item.id !== highlightId),
        },
      };
    });
  }

  function updateProgress(lessonSlug: string, ratio: number) {
    setStorage(current => {
      const lessonKey = buildStoredLessonKey(
        current.readerSettings.readingLanguage,
        lessonSlug,
      );
      const rounded = Math.max(0, Math.min(1, Number(ratio.toFixed(2))));
      const previous = getStoredProgress(
        current.progress,
        lessonSlug,
        current.readerSettings.readingLanguage,
      );

      if (previous && Math.abs(previous.ratio - rounded) < 0.04) {
        return current;
      }

      return {
        ...current,
        progress: {
          ...current.progress,
          [lessonKey]: {
            ratio: rounded,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function updateNote(lessonSlug: string, value: string) {
    setStorage(current => {
      const lessonKey = buildStoredLessonKey(
        current.readerSettings.readingLanguage,
        lessonSlug,
      );

      return {
        ...current,
        notes: {
          ...current.notes,
          [lessonKey]: value,
        },
      };
    });
  }

  let content: React.JSX.Element;
  const playbackStateValue =
    playbackState.state === State.Error &&
    isNetworkPlaybackError(playbackState.error)
      ? State.Buffering
      : playbackState.state;
  const shouldShowMiniPlayer =
    !miniPlayerMinimized &&
    route.name !== 'audio' &&
    route.name !== 'video' &&
    Boolean(activeTrack) &&
    playbackStateValue !== undefined &&
    (playbackStateValue === State.Playing ||
      playbackStateValue === State.Buffering ||
      playbackStateValue === State.Loading);
  const settingsPreviewRoute =
    route.name === 'settings' ? previousRoute : route;
  const settingsPreviewLesson =
    settingsPreviewRoute?.name === 'lesson'
      ? usesAdminSyncedContent(storage.readerSettings.readingLanguage)
        ? getDisplayLesson(
            getRemoteLessonForRoute(
              remoteLessons,
              getDisplaySeries(
                remoteSeries.find(
                  item =>
                    item.slug === settingsPreviewRoute.seriesSlug &&
                    isSameReadingLanguage(
                      item.language,
                      storage.readerSettings.readingLanguage,
                    ),
                ) ?? null,
                settingsPreviewRoute.seriesSlug,
                storage.readerSettings.readingLanguage,
              ),
              storage.readerSettings.readingLanguage,
              settingsPreviewRoute.lessonSlug,
            ),
            settingsPreviewRoute.lessonSlug,
            storage.readerSettings.readingLanguage,
          )
        : getLessonBySlug(settingsPreviewRoute.lessonSlug)
      : null;

  if (!hydrated) {
    content = <LoadingSkeleton palette={palette} label="Loading library" />;
  } else if (route.name === 'study-room') {
    const lesson = bibleStudyCourse.lessons.find(
      item => item.slug === route.lessonSlug,
    );
    content = lesson ? (
      <StudyRoomScreen
        key={lesson.slug}
        course={bibleStudyCourse}
        lesson={lesson}
        styles={styles}
        palette={palette}
        settings={storage.readerSettings}
        onBack={() => {
          setRouteHistory([]);
          replaceRoute({ name: 'library', section: 'bible-courses' });
        }}
        onOpenLesson={lessonSlug =>
          replaceRoute({ name: 'study-room', lessonSlug })
        }
      />
    ) : (
      <MissingState styles={styles} onBack={goBack} />
    );
  } else if (route.name === 'series') {
    const useAdminContent = usesAdminSyncedContent(
      storage.readerSettings.readingLanguage,
    );
    const series = useAdminContent
      ? getDisplaySeries(
          remoteSeries.find(
            item =>
              item.slug === route.seriesSlug &&
              isSameReadingLanguage(
                item.language,
                storage.readerSettings.readingLanguage,
              ),
          ) ?? null,
          route.seriesSlug,
          storage.readerSettings.readingLanguage,
        )
      : getSeriesBySlug(route.seriesSlug);
    content = series ? (
      <SeriesScreen
        series={series}
        styles={styles}
        palette={palette}
        staticText={staticText}
        isLoadingLessons={
          series.lessonCount > 0 &&
          series.lessons.length === 0 &&
          !(
            readerFetch?.key ===
              `${storage.readerSettings.readingLanguage}:${route.seriesSlug}:` &&
            readerFetch.failed
          )
        }
        searchOpen={activeSearch === 'library'}
        searchQuery={libraryQuery}
        onChangeSearchQuery={setLibraryQuery}
        onToggleSearch={() =>
          setActiveSearch(current => (current === 'library' ? null : 'library'))
        }
        onBack={goBack}
        onOpenSaved={openSaved}
        onOpenLesson={openLesson}
      />
    ) : readerFetch?.key ===
        `${storage.readerSettings.readingLanguage}:${route.seriesSlug}:` &&
      readerFetch.failed ? (
      <MissingState styles={styles} onBack={goBack} />
    ) : (
      <LoadingSkeleton palette={palette} label="Loading chapters" />
    );
  } else if (route.name === 'lesson') {
    const isRemoteReader = usesAdminSyncedContent(
      storage.readerSettings.readingLanguage,
    );
    const series = isRemoteReader
      ? getDisplaySeries(
          remoteSeries.find(
            item =>
              item.slug === route.seriesSlug &&
              isSameReadingLanguage(
                item.language,
                storage.readerSettings.readingLanguage,
              ),
          ) ?? null,
          route.seriesSlug,
          storage.readerSettings.readingLanguage,
        )
      : getSeriesBySlug(route.seriesSlug);
    const baseLesson = getLocalFallbackLesson(
      route.lessonSlug,
      storage.readerSettings.readingLanguage,
    );
    const lesson = isRemoteReader
      ? getDisplayLesson(
          getRemoteLessonForRoute(
            remoteLessons,
            series ?? null,
            storage.readerSettings.readingLanguage,
            route.lessonSlug,
          ),
          route.lessonSlug,
          storage.readerSettings.readingLanguage,
        )
      : baseLesson
      ? getLessonForReadingLanguage(
          baseLesson,
          storage.readerSettings.readingLanguage,
        )
      : null;
    const hasCompleteBody = Boolean(
      baseLesson?.blocks.length ||
        (lesson && !isRemoteSummaryLesson(lesson) && lesson.blocks.length),
    );
    const requestFailed =
      readerFetch?.key ===
        `${storage.readerSettings.readingLanguage}:${route.seriesSlug}:${route.lessonSlug}` &&
      readerFetch.failed;
    content =
      !hasCompleteBody && !requestFailed ? (
        <LoadingSkeleton
          palette={palette}
          variant="reader"
          label="Loading chapter"
        />
      ) : series && lesson && hasCompleteBody ? (
        <LessonScreen
          lesson={lesson}
          seriesTitle={series.title}
          adjacent={
            isRemoteReader
              ? getRemoteAdjacentLessons(series, route.lessonSlug)
              : getAdjacentLessons(route.seriesSlug, route.lessonSlug)
          }
          note={getStoredNote(
            storage.notes,
            route.lessonSlug,
            storage.readerSettings.readingLanguage,
          )}
          highlights={getStoredHighlights(
            storage.highlights,
            route.lessonSlug,
            storage.readerSettings.readingLanguage,
          )}
          isFavorite={hasStoredFavorite(storage.favorites, route.lessonSlug)}
          progress={getStoredProgress(
            storage.progress,
            route.lessonSlug,
            storage.readerSettings.readingLanguage,
          )}
          settings={storage.readerSettings}
          palette={palette}
          typography={typography}
          styles={styles}
          staticText={staticText}
          bottomChromeOffset={bottomChromeOffset}
          searchTarget={
            route.searchQuery
              ? { query: route.searchQuery, nonce: route.searchNonce ?? 0 }
              : undefined
          }
          chromeHidden={readerChromeHidden}
          onBack={goBack}
          onOpenSaved={openSaved}
          onOpenReaderSheet={() => setReaderSheetOpen(true)}
          onHideChrome={() => setReaderChromeHidden(true)}
          onShowChrome={() => setReaderChromeHidden(false)}
          onToggleFavorite={() => toggleFavorite(route.lessonSlug)}
          onOpenLesson={lessonSlug =>
            openLesson(route.seriesSlug, lessonSlug, { replace: true })
          }
          onSaveHighlight={highlight =>
            saveHighlight(route.lessonSlug, highlight)
          }
          onClearHighlight={highlightId =>
            clearHighlight(route.lessonSlug, highlightId)
          }
          onUpdateProgress={ratio => updateProgress(route.lessonSlug, ratio)}
          onUpdateNote={value => updateNote(route.lessonSlug, value)}
        />
      ) : (
        <MissingState styles={styles} onBack={goBack} />
      );
  } else if (route.name === 'library') {
    content = (
      <LibraryScreen
        bibleStudyCourse={bibleStudyCourse}
        onOpenStudyRoom={lessonSlug =>
          navigateTo({ name: 'study-room', lessonSlug })
        }
        topSeries={topSeries}
        styles={styles}
        palette={palette}
        staticText={staticText}
        readingLanguage={storage.readerSettings.readingLanguage}
        initialSection={route.section}
        loading={catalogPending && topSeries.length === 0}
        searchOpen={activeSearch === 'library'}
        searchQuery={libraryQuery}
        onChangeSearchQuery={setLibraryQuery}
        onToggleSearch={() =>
          setActiveSearch(current => (current === 'library' ? null : 'library'))
        }
        onChangeSection={section => replaceRoute({ name: 'library', section })}
        onBack={canGoBack ? goBack : undefined}
        onOpenSaved={openSaved}
        onOpenSettings={() => openSettings(true)}
        onOpenSeries={openSeries}
        onOpenLesson={openLesson}
      />
    );
  } else if (route.name === 'audio') {
    content = (
      <AudioLibraryScreen
        loading={mediaPending && audioCollections.length === 0}
        styles={styles}
        palette={palette}
        staticText={staticText}
        query={audioQuery}
        audioCollections={audioCollections}
        downloadedAudio={storage.downloadedAudio}
        downloadProgress={audioDownloadProgress}
        playbackRate={audioPlaybackRate}
        onChangePlaybackRate={setAudioPlaybackRate}
        onOpenFullscreenPlayer={() => setAudioPlayerOpen(true)}
        onBack={canGoBack ? goBack : undefined}
        onDownloadAudio={downloadAudio}
        onDeleteAudio={confirmDeleteAudio}
        targetCollectionKey={route.collectionKey}
        targetTrackFileName={route.trackFileName}
      />
    );
  } else if (route.name === 'video') {
    content = (
      <VideoLibraryScreen
        loading={mediaPending && videoCollections.length === 0}
        styles={styles}
        palette={palette}
        staticText={staticText}
        query={videoQuery}
        videoCollections={videoCollections}
        onBack={canGoBack ? goBack : undefined}
      />
    );
  } else if (route.name === 'saved') {
    content = (
      <SavedScreen
        styles={styles}
        staticText={staticText}
        favoriteLessons={favoriteLessons}
        highlightEntries={highlightEntries}
        notes={groupedNotes}
        onBack={goBack}
        onOpenLesson={openLesson}
      />
    );
  } else if (route.name === 'settings') {
    content = (
      <SettingsScreen
        styles={styles}
        staticText={staticText}
        settings={storage.readerSettings}
        palette={palette}
        onBack={goBack}
        previewLesson={settingsPreviewLesson}
        previewRoute={settingsPreviewRoute}
        onUpdateThemeMode={updateThemeMode}
        onUpdateFontChoice={updateFontChoice}
        onUpdateReadingLanguage={updateReadingLanguage}
        onBumpFontScale={bumpFontScale}
        onBumpLineHeight={bumpLineHeight}
        onUpdateFontScaleByIndex={updateFontScaleByIndex}
        onUpdateLineHeightByIndex={updateLineHeightByIndex}
        onOpenSaved={openSaved}
        onOpenAbout={() => navigateTo({ name: 'about' })}
        savedSummary={savedSummary}
        cacheSummary={cacheSummary}
        downloadedAudioSummary={downloadedAudioSummary}
      />
    );
  } else if (route.name === 'about') {
    content = <AboutScreen styles={styles} palette={palette} onBack={goBack} />;
  } else {
    content = (
      <HomeScreen
        readingLanguage={activeReadingLanguage}
        key={`${activeReadingLanguage}:${storage.readerSettings.fontChoice}`}
        styles={styles}
        palette={palette}
        staticText={staticText}
        continueReadingItems={continueReadingItems}
        lessonCount={topSeries.reduce(
          (total, series) => total + series.lessonCount,
          0,
        )}
        seriesCount={topSeries.length}
        featuredSeries={featuredSeries}
        onOpenSeries={openSeries}
        featuredVideo={featuredVideo}
        featuredAudioCollections={featuredAudioCollections}
        onBack={canGoBack ? goBack : undefined}
        onOpenLesson={openLesson}
        onOpenAudio={(collectionKey, trackFileName) => {
          setMiniPlayerMinimized(false);
          navigateTo({ name: 'audio', collectionKey, trackFileName });
        }}
        onOpenSaved={openSaved}
        onOpenSearch={() => {
          navigateTo({ name: 'library', section: 'study-materials' });
          setActiveSearch('library');
        }}
        onOpenSettings={() => openSettings(true)}
      />
    );
  }

  return (
    <TypographyProvider value={typography}>
      <View style={[styles.appRoot, { backgroundColor: palette.background }]}>
        <StatusBar
          barStyle={
            splashVisible || showOnboarding
              ? 'light-content'
              : palette.statusBar
          }
          backgroundColor={
            splashVisible || showOnboarding
              ? splashBackgroundColor
              : palette.background
          }
        />
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: palette.background }]}
          edges={['top', 'left', 'right']}
        >
          <View style={styles.appShell}>
            <BackgroundGlow styles={styles} />
            <Animated.View
              key={routeKey}
              style={[
                styles.screenTransition,
                {
                  opacity: routeTransition,
                  transform: [
                    {
                      translateX: routeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {content}
            </Animated.View>
            {shouldShowMiniPlayer ? (
              <GlobalAudioMiniPlayer
                styles={styles}
                palette={palette}
                bottomOffset={bottomChromeOffset}
                track={activeTrack}
                playbackState={playbackStateValue}
                progress={miniPlayerProgress}
                playbackRate={audioPlaybackRate}
                onChangePlaybackRate={setAudioPlaybackRate}
                onOpenAudio={() => {
                  setMiniPlayerMinimized(false);
                  selectTab('audio');
                }}
                onOpenFullscreen={() => setAudioPlayerOpen(true)}
                onMinimize={() => setMiniPlayerMinimized(true)}
              />
            ) : null}
            <BottomTabs
              styles={styles}
              palette={palette}
              staticText={staticText}
              route={route}
              bottomOffset={bottomChromeOffset}
              visibility={bottomTabsVisibility}
              hidden={route.name === 'lesson' && readerChromeHidden}
              onSelectTab={selectTab}
            />
            <ReaderControlsSheet
              open={readerSheetOpen}
              styles={styles}
              staticText={staticText}
              settings={storage.readerSettings}
              palette={palette}
              onClose={() => setReaderSheetOpen(false)}
              onOpenFullSettings={() => {
                setReaderSheetOpen(false);
                openSettings(true);
              }}
              onUpdateThemeMode={updateThemeMode}
              onUpdateFontChoice={updateFontChoice}
              onUpdateReadingLanguage={updateReadingLanguage}
              onBumpFontScale={bumpFontScale}
              onBumpLineHeight={bumpLineHeight}
              onUpdateFontScaleByIndex={updateFontScaleByIndex}
              onUpdateLineHeightByIndex={updateLineHeightByIndex}
            />
            <AudioFullscreenPlayerModal
              visible={audioPlayerOpen}
              styles={styles}
              palette={palette}
              track={activeTrack}
              playbackState={playbackStateValue}
              progress={miniPlayerProgress}
              playbackRate={audioPlaybackRate}
              onChangePlaybackRate={setAudioPlaybackRate}
              onClose={() => setAudioPlayerOpen(false)}
            />
            {showOnboarding ? (
              <OnboardingCarousel
                styles={styles}
                palette={palette}
                onFinish={completeOnboarding}
              />
            ) : null}
          </View>
        </SafeAreaView>
        {splashVisible ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.splashOverlay, { opacity: splashOpacity }]}
          >
            <ImageBackground
              source={splashLeather}
              style={styles.splashLeather}
              imageStyle={styles.splashLeatherImage}
              resizeMode="repeat"
            >
              <View style={styles.splashLogoGroup}>
                <View style={styles.splashLogoFrame}>
                  <Image
                    source={splashLogo}
                    style={styles.splashLogo}
                    resizeMode="cover"
                  />
                </View>
                <Animated.Text style={styles.splashTitle}>
                  Jack Sequeira Ministries
                </Animated.Text>
              </View>
            </ImageBackground>
          </Animated.View>
        ) : null}
      </View>
    </TypographyProvider>
  );
}

function OnboardingCarousel({
  styles,
  palette,
  onFinish,
}: {
  styles: AppStyles;
  palette: (typeof palettes)[ReaderSettings['themeMode']];
  onFinish: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = onboardingSlides[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === onboardingSlides.length - 1;

  function goNext() {
    if (isLast) {
      onFinish();
      return;
    }

    setActiveIndex(index => Math.min(index + 1, onboardingSlides.length - 1));
  }

  function goBack() {
    setActiveIndex(index => Math.max(index - 1, 0));
  }

  return (
    <View style={styles.onboardingOverlay}>
      <ImageBackground
        source={splashLeather}
        style={styles.onboardingBackground}
        imageStyle={styles.onboardingBackgroundImage}
        resizeMode="repeat"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip walkthrough"
          onPress={onFinish}
          style={styles.onboardingSkipButton}
        >
          <Text style={styles.onboardingSkipText}>Skip</Text>
        </Pressable>

        <View style={styles.onboardingContent}>
          <View style={styles.onboardingPhoneFrame}>
            <View style={styles.onboardingPhoneTop}>
              <View style={styles.onboardingSpeaker} />
              <Text style={styles.onboardingPhoneTime}>6:20</Text>
            </View>
            <View style={styles.onboardingMockScreen}>
              <Image
                source={slide.image}
                style={styles.onboardingScreenshot}
                resizeMode="cover"
              />
            </View>
          </View>

          <ScrollView
            style={styles.onboardingTextScroll}
            contentContainerStyle={styles.onboardingTextContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.onboardingEyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.onboardingTitle}>{slide.title}</Text>
            <Text style={styles.onboardingBody}>{slide.body}</Text>
          </ScrollView>
        </View>

        <View style={styles.onboardingFooter}>
          <View style={styles.onboardingDots}>
            {onboardingSlides.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.onboardingDot,
                  index === activeIndex && styles.onboardingDotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.onboardingControls}>
            <Pressable
              accessibilityRole="button"
              disabled={isFirst}
              onPress={goBack}
              style={[
                styles.onboardingSecondaryButton,
                isFirst && styles.onboardingButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.onboardingSecondaryButtonText,
                  isFirst && styles.onboardingButtonTextDisabled,
                ]}
              >
                Back
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goNext}
              style={[
                styles.onboardingPrimaryButton,
                { backgroundColor: palette.primarySolid },
              ]}
            >
              <Text style={styles.onboardingPrimaryButtonText}>
                {isLast ? 'Start' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function getRouteKey(route: Route) {
  switch (route.name) {
    case 'study-room':
      return `${route.name}:${route.lessonSlug}`;
    case 'library':
      return `${route.name}:${route.section ?? 'study-materials'}`;
    case 'series':
      return `${route.name}:${route.seriesSlug}`;
    case 'lesson':
      return `${route.name}:${route.seriesSlug}:${route.lessonSlug}:${
        route.searchNonce ?? ''
      }`;
    case 'audio':
      return `${route.name}:${route.collectionKey ?? ''}:${
        route.trackFileName ?? ''
      }`;
    default:
      return route.name;
  }
}

function routesEqual(left: Route, right: Route) {
  return getRouteKey(left) === getRouteKey(right);
}

function isRememberableReadRoute(route: Route) {
  return (
    route.name === 'study-room' ||
    route.name === 'library' ||
    route.name === 'series' ||
    route.name === 'lesson'
  );
}

function getRememberedLibraryRoute(route: Route): Route {
  return isRememberableReadRoute(route) ? route : { name: 'library' };
}

function buildReadRouteHistory(route: Route): Route[] {
  switch (route.name) {
    case 'study-room':
      return [{ name: 'library', section: 'bible-courses' }];
    case 'lesson':
      return [
        {
          name: 'library',
          section: getLibrarySectionForSeriesSlug(route.seriesSlug),
        },
        { name: 'series', seriesSlug: route.seriesSlug },
      ];
    case 'series':
      return [
        {
          name: 'library',
          section: getLibrarySectionForSeriesSlug(route.seriesSlug),
        },
      ];
    default:
      return [];
  }
}

function getLibrarySectionForSeriesSlug(seriesSlug: string): ReadSection {
  const series = getSeriesBySlug(seriesSlug);
  return series?.category === 'bible-study'
    ? 'bible-courses'
    : 'study-materials';
}

function buildStoredLessonKey(language: ReadingLanguage, lessonSlug: string) {
  return `${language}:${lessonSlug}`;
}

function parseStoredLessonKey(key: string): {
  language: ReadingLanguage | null;
  slug: string;
} {
  const match = key.match(/^(en|am|om|tm|ru):(.+)$/);
  if (!match) {
    return { language: null, slug: key };
  }

  return {
    language: match[1] as ReadingLanguage,
    slug: match[2],
  };
}

function getStoredNote(
  notes: StorageState['notes'],
  lessonSlug: string,
  language: ReadingLanguage,
) {
  const languageKey = buildStoredLessonKey(language, lessonSlug);
  if (typeof notes[languageKey] === 'string') {
    return notes[languageKey];
  }

  if (typeof notes[lessonSlug] === 'string') {
    return notes[lessonSlug];
  }

  const translatedEntry = Object.entries(notes).find(
    ([key, value]) =>
      parseStoredLessonKey(key).slug === lessonSlug && value.trim().length > 0,
  );
  return translatedEntry?.[1] ?? '';
}

function getStoredHighlights(
  highlights: StorageState['highlights'],
  lessonSlug: string,
  language: ReadingLanguage,
) {
  const languageKey = buildStoredLessonKey(language, lessonSlug);
  const candidates = [
    ...(highlights[languageKey] ?? []),
    ...(highlights[lessonSlug] ?? []),
    ...Object.entries(highlights)
      .filter(([key]) => {
        const parsed = parseStoredLessonKey(key);
        return parsed.language !== language && parsed.slug === lessonSlug;
      })
      .flatMap(([, value]) => value),
  ];
  const seen = new Set<string>();

  return candidates.filter(highlight => {
    if (seen.has(highlight.id)) {
      return false;
    }

    seen.add(highlight.id);
    return true;
  });
}

function getStoredProgress(
  progress: StorageState['progress'],
  lessonSlug: string,
  language: ReadingLanguage,
) {
  const languageKey = buildStoredLessonKey(language, lessonSlug);
  return progress[languageKey] ?? progress[lessonSlug];
}

function hasStoredFavorite(favorites: string[], lessonSlug: string) {
  return favorites.some(item => parseStoredLessonKey(item).slug === lessonSlug);
}

function getTranslatedHighlightText(
  highlight: LessonHighlight,
  lesson: ArchiveLesson,
) {
  const range = parseStoredHighlightCharacterRange(highlight.id, lesson.slug);
  if (!range) {
    return highlight.text;
  }

  const plainText = blocksToPlainText(lesson.blocks).replace(/\s+/g, ' ');
  const text = plainText
    .slice(range.startIndex, range.endIndex + 1)
    .replace(/\s+/g, ' ')
    .trim();

  return text || highlight.text;
}

function parseStoredHighlightCharacterRange(
  highlightId: string,
  lessonSlug: string,
) {
  const match = highlightId.match(/^(.*):chars:(\d+)(?:-(\d+))?$/);
  if (!match || match[1] !== lessonSlug) {
    return null;
  }

  const startIndex = Number(match[2]);
  const endIndex = Number(match[3] ?? match[2]);
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
    return null;
  }

  return { startIndex, endIndex };
}

function buildRemoteLessonKey(language: ReadingLanguage, lessonSlug: string) {
  return `${getRemoteApiLanguage(language)}:${lessonSlug}`;
}

function buildRemoteSeriesCacheKey(
  language: ReadingLanguage,
  seriesSlug: string,
) {
  return `${getRemoteApiLanguage(language)}:${seriesSlug}`;
}

function usesAdminSyncedContent(language: ReadingLanguage) {
  return language === 'en' || isRemoteReadingLanguage(language);
}

function getLocalFallbackSeries(language: ReadingLanguage) {
  return language === 'en' ? getTopSeries(language) : [];
}

function getLocalFallbackSeriesBySlug(
  seriesSlug: string,
  language: ReadingLanguage,
) {
  if (language !== 'en') {
    return null;
  }

  return getSeriesBySlug(seriesSlug);
}

function getLocalFallbackLesson(lessonSlug: string, language: ReadingLanguage) {
  if (language !== 'en') {
    return null;
  }

  return getLessonBySlug(lessonSlug);
}

function getDisplaySeriesList(
  adminSeries: ArchiveSeries[],
  language: ReadingLanguage,
) {
  return adminSeries.map(
    series => getDisplaySeries(series, series.slug, language) ?? series,
  );
}

function getDisplaySeries(
  adminSeries: ArchiveSeries | null,
  seriesSlug: string,
  language: ReadingLanguage,
): ArchiveSeries | null {
  if (!adminSeries) return getLocalFallbackSeriesBySlug(seriesSlug, language);
  const local = language === 'en' ? getSeriesBySlug(seriesSlug) : null;
  // Older servers omit lesson summaries; retain the downloaded/bundled bodies until fetched.
  const sourceLessons = adminSeries.lessons.length
    ? adminSeries.lessons
    : adminSeries.lessonCount === 0
    ? []
    : local?.lessons ?? [];
  const lessons = sourceLessons.map(
    lesson => getDisplayLesson(lesson, lesson.slug, language) ?? lesson,
  );
  return {
    ...adminSeries,
    lessons,
    lessonSlugs: lessons.map(lesson => lesson.slug),
  };
}

function getDisplayLesson(
  adminLesson: ArchiveLesson | null,
  lessonSlug: string,
  language: ReadingLanguage,
): ArchiveLesson | null {
  const local = getLocalFallbackLesson(lessonSlug, language);
  if (!adminLesson) return local;
  if (isRemoteSummaryLesson(adminLesson) && local)
    return {
      ...local,
      ...adminLesson,
      blocks: local.blocks,
      searchableText: local.searchableText,
    };
  return adminLesson;
}

function isRemoteSummaryLesson(lesson: ArchiveLesson) {
  return (
    lesson.sourcePath.startsWith('remote-summary:') ||
    lesson.sourcePath.startsWith('remote:') ||
    lesson.blocks.length === 0
  );
}

function isSameReadingLanguage(
  contentLanguage: string,
  readingLanguage: ReadingLanguage,
) {
  return contentLanguage === getRemoteApiLanguage(readingLanguage);
}

function mergeRemoteSeries(
  current: ArchiveSeries[],
  nextSeries: ArchiveSeries,
) {
  const exists = current.some(
    series =>
      series.slug === nextSeries.slug &&
      series.language === nextSeries.language,
  );
  if (!exists) {
    return [...current, nextSeries];
  }

  return current.map(series =>
    series.slug === nextSeries.slug && series.language === nextSeries.language
      ? nextSeries
      : series,
  );
}

function getRemoteLessonForRoute(
  remoteLessons: Record<string, ArchiveLesson>,
  series: ArchiveSeries | null,
  language: ReadingLanguage,
  lessonSlug: string,
) {
  return (
    remoteLessons[buildRemoteLessonKey(language, lessonSlug)] ??
    series?.lessons.find(lesson => lesson.slug === lessonSlug) ??
    null
  );
}

function getRemoteAdjacentLessons(series: ArchiveSeries, lessonSlug: string) {
  const index = series.lessons.findIndex(lesson => lesson.slug === lessonSlug);
  return {
    previous: index > 0 ? series.lessons[index - 1] : null,
    next:
      index >= 0 && index < series.lessons.length - 1
        ? series.lessons[index + 1]
        : null,
  };
}
