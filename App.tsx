import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Platform, StatusBar, View } from 'react-native';
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
  fetchRemoteLesson,
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
  type ReaderSettings,
  type StorageState,
} from './src/storage';
import {
  isReadRoute,
  type Route,
  type SearchScope,
  type TabKey,
} from './src/app/navigation';
import { createStyles } from './src/app/styles';
import {
  BackgroundGlow,
  BottomTabs,
  GlobalAudioMiniPlayer,
} from './src/app/components/Chrome';
import { AudioFullscreenPlayerModal } from './src/app/components/MediaPlayer';
import { ReaderControlsSheet } from './src/app/components/ReaderControlsSheet';
import {
  AudioLibraryScreen,
  HomeScreen,
  LibraryScreen,
  LessonScreen,
  MissingState,
  SavedScreen,
  SeriesScreen,
  SettingsScreen,
  VideoLibraryScreen,
} from './src/app/screens';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ArchiveApp />
    </SafeAreaProvider>
  );
}

function ArchiveApp() {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [overlayBackRoute, setOverlayBackRoute] = useState<Route | null>(null);
  const [storage, setStorage] = useState<StorageState>(defaultStorageState);
  const [hydrated, setHydrated] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SearchScope | null>(null);
  const [readerSheetOpen, setReaderSheetOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [audioQuery] = useState('');
  const [videoQuery] = useState('');
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const [miniPlayerMinimized, setMiniPlayerMinimized] = useState(false);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [remoteCatalogLoading, setRemoteCatalogLoading] = useState(false);
  const [remoteSeriesLoadingKey, setRemoteSeriesLoadingKey] = useState<
    string | null
  >(null);
  const [remoteSeries, setRemoteSeries] = useState<ArchiveSeries[]>([]);
  const [remoteLessons, setRemoteLessons] = useState<
    Record<string, ArchiveLesson>
  >({});
  const lastReadRouteRef = useRef<Route>({ name: 'library' });
  const remoteCacheRef = useRef(storage.remoteCache);
  const routeTransition = useRef(new Animated.Value(1)).current;
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
      saveStorageState(storage);
    }
  }, [hydrated, storage]);

  useEffect(() => {
    remoteCacheRef.current = storage.remoteCache;
  }, [storage.remoteCache]);

  useEffect(() => {
    if (isReadRoute(route)) {
      lastReadRouteRef.current = route;
    }
  }, [route]);

  const routeKey = getRouteKey(route);

  useEffect(() => {
    routeTransition.setValue(0);
    Animated.timing(routeTransition, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [routeKey, routeTransition]);

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

  useEffect(() => {
    let active = true;
    const readingLanguage = storage.readerSettings.readingLanguage;

    if (!isRemoteReadingLanguage(readingLanguage)) {
      setRemoteCatalogLoading(false);
      setRemoteSeriesLoadingKey(null);
      setRemoteSeries([]);
      setRemoteLessons({});
      return;
    }

    const cachedCatalog =
      remoteCacheRef.current.seriesCatalogs[readingLanguage];
    setRemoteLessons({});
    setRemoteSeries(cachedCatalog ?? []);
    setRemoteCatalogLoading(!cachedCatalog);
    fetchRemoteSeriesCatalog(readingLanguage)
      .then(series => {
        if (active) {
          setRemoteSeries(series);
          cacheRemoteCatalog(readingLanguage, series);
        }
      })
      .catch(() => {
        if (active && !cachedCatalog) {
          setRemoteSeries([]);
        }
      })
      .finally(() => {
        if (active) {
          setRemoteCatalogLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [cacheRemoteCatalog, storage.readerSettings.readingLanguage]);

  useEffect(() => {
    if (route.name !== 'series') {
      return;
    }

    const readingLanguage = storage.readerSettings.readingLanguage;
    if (!isRemoteReadingLanguage(readingLanguage)) {
      return;
    }
    const cacheKey = buildRemoteSeriesCacheKey(
      readingLanguage,
      route.seriesSlug,
    );

    const existing = remoteSeries.find(
      series =>
        series.slug === route.seriesSlug &&
        isSameReadingLanguage(series.language, readingLanguage),
    );
    if (existing && existing.lessons.length > 0) {
      return;
    }

    const cachedSeries = remoteCacheRef.current.series[cacheKey];
    if (cachedSeries) {
      setRemoteSeries(current => mergeRemoteSeries(current, cachedSeries));
      return;
    }

    let active = true;
    setRemoteSeriesLoadingKey(cacheKey);
    fetchRemoteSeries(route.seriesSlug, readingLanguage)
      .then(series => {
        if (!active) {
          return;
        }
        setRemoteSeries(current => mergeRemoteSeries(current, series));
        cacheRemoteSeries(cacheKey, series);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setRemoteSeriesLoadingKey(current =>
            current === cacheKey ? null : current,
          );
        }
      });

    return () => {
      active = false;
    };
  }, [
    cacheRemoteSeries,
    route,
    remoteSeries,
    storage.readerSettings.readingLanguage,
  ]);

  useEffect(() => {
    if (route.name !== 'lesson') {
      return;
    }

    const readingLanguage = storage.readerSettings.readingLanguage;
    if (!isRemoteReadingLanguage(readingLanguage)) {
      return;
    }

    const key = buildRemoteLessonKey(readingLanguage, route.lessonSlug);
    if (remoteLessons[key]?.blocks.length > 0) {
      return;
    }

    const cachedLesson = remoteCacheRef.current.lessons[key];
    if (cachedLesson?.blocks.length > 0) {
      setRemoteLessons(current => ({
        ...current,
        [key]: cachedLesson,
      }));
      setRemoteSeries(current =>
        current.map(item =>
          item.slug === cachedLesson.seriesSlug &&
          isSameReadingLanguage(item.language, readingLanguage)
            ? {
                ...item,
                lessons: item.lessons.some(
                  existingLesson => existingLesson.slug === cachedLesson.slug,
                )
                  ? item.lessons.map(existingLesson =>
                      existingLesson.slug === cachedLesson.slug
                        ? cachedLesson
                        : existingLesson,
                    )
                  : [...item.lessons, cachedLesson],
              }
            : item,
        ),
      );
      return;
    }

    const series = remoteSeries.find(
      item =>
        item.slug === route.seriesSlug &&
        isSameReadingLanguage(item.language, readingLanguage),
    );
    if (!series) {
      return;
    }

    let active = true;
    fetchRemoteLesson({
      lessonSlug: route.lessonSlug,
      series,
      language: readingLanguage,
    })
      .then(lesson => {
        if (!active) {
          return;
        }
        setRemoteLessons(current => ({
          ...current,
          [key]: lesson,
        }));
        cacheRemoteLesson(key, lesson);
        setRemoteSeries(current =>
          current.map(item =>
            item.slug === series.slug &&
            isSameReadingLanguage(item.language, readingLanguage)
              ? {
                  ...item,
                  lessons: item.lessons.map(existingLesson =>
                    existingLesson.slug === lesson.slug
                      ? lesson
                      : existingLesson,
                  ),
                }
              : item,
          ),
        );
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [
    route,
    cacheRemoteLesson,
    remoteLessons,
    remoteSeries,
    storage.readerSettings.readingLanguage,
  ]);

  useEffect(() => {
    if (!isReadRoute(route)) {
      return;
    }

    const readingLanguage = storage.readerSettings.readingLanguage;
    if (isRemoteReadingLanguage(readingLanguage)) {
      if (route.name === 'lesson') {
        const series = remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(item.language, readingLanguage),
        );
        const lesson = getRemoteLessonForRoute(
          remoteLessons,
          series ?? null,
          readingLanguage,
          route.lessonSlug,
        );
        if (!series || (series.lessons.length > 0 && !lesson)) {
          closeTransientUi();
          setRoute({ name: 'library' });
        }
      }

      if (route.name === 'series') {
        const series = remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(item.language, readingLanguage),
        );
        if (remoteSeries.length > 0 && !series) {
          closeTransientUi();
          setRoute({ name: 'library' });
        }
      }
      return;
    }

    if (route.name === 'lesson') {
      const lesson = getLessonBySlug(route.lessonSlug);
      if (!lesson || lesson.language !== readingLanguage) {
        closeTransientUi();
        setRoute({ name: 'library' });
      }
      return;
    }

    if (route.name === 'series') {
      const series = getSeriesBySlug(route.seriesSlug);
      if (!series || series.language !== readingLanguage) {
        closeTransientUi();
        setRoute({ name: 'library' });
      }
    }
  }, [
    route,
    remoteLessons,
    remoteSeries,
    storage.readerSettings.readingLanguage,
  ]);

  const palette = palettes[storage.readerSettings.themeMode];
  const typography = resolveAppTypography(
    storage.readerSettings.fontChoice,
    storage.readerSettings.readingLanguage,
  );
  const styles = createStyles(palette, typography);
  const bottomChromeOffset =
    Platform.OS === 'android'
      ? insets.bottom > 12
        ? insets.bottom + 6
        : 6
      : Math.min(insets.bottom, 10);

  const topSeries = isRemoteReadingLanguage(storage.readerSettings.readingLanguage)
    ? remoteSeries
    : getTopSeries(storage.readerSettings.readingLanguage);

  const continueReadingItems = storage.recents
    .map(slug => {
      const lesson = getLessonBySlug(slug);
      if (!lesson) {
        return null;
      }
      return { lesson, progress: storage.progress[slug] };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;

  const favoriteLessons = storage.favorites
    .map(slug => getLessonBySlug(slug))
    .filter(Boolean) as ArchiveLesson[];

  const highlightEntries = Object.entries(storage.highlights ?? {})
    .flatMap(([lessonSlug, highlights]) =>
      highlights.map(highlight => ({ lessonSlug, highlight })),
    )
    .sort((left, right) =>
      right.highlight.createdAt.localeCompare(left.highlight.createdAt),
    );

  const groupedNotes = Object.entries(storage.notes ?? {})
    .filter(([, value]) => value.trim().length > 0)
    .map(([lessonSlug, value]) => ({ lessonSlug, value }))
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

  function closeTransientUi() {
    setActiveSearch(null);
    setReaderSheetOpen(false);
  }

  function selectTab(tab: TabKey) {
    closeTransientUi();
    switch (tab) {
      case 'home':
        setOverlayBackRoute(null);
        setRoute({ name: 'home' });
        return;
      case 'library':
        setOverlayBackRoute(null);
        setRoute(lastReadRouteRef.current);
        return;
      case 'audio':
        setOverlayBackRoute(null);
        setMiniPlayerMinimized(false);
        setRoute({ name: 'audio' });
        return;
      case 'video':
        setOverlayBackRoute(null);
        setRoute({ name: 'video' });
        return;
      case 'settings':
        setOverlayBackRoute(route.name === 'settings' ? overlayBackRoute : route);
        setRoute({ name: 'settings' });
        return;
    }
  }

  function openSeries(seriesSlug: string) {
    closeTransientUi();
    setRoute({ name: 'series', seriesSlug });
  }

  function openLesson(seriesSlug: string, lessonSlug: string) {
    setStorage(current => ({
      ...current,
      recents: [
        lessonSlug,
        ...current.recents.filter(slug => slug !== lessonSlug),
      ].slice(0, 10),
    }));
    closeTransientUi();
    setRoute({ name: 'lesson', seriesSlug, lessonSlug });
  }

  function openSaved() {
    setOverlayBackRoute(route);
    closeTransientUi();
    setRoute({ name: 'saved' });
  }

  function openSettings(fromCurrentRoute = true) {
    setOverlayBackRoute(fromCurrentRoute ? route : null);
    closeTransientUi();
    setRoute({ name: 'settings' });
  }

  function goBack() {
    closeTransientUi();
    if (overlayBackRoute) {
      const previous = overlayBackRoute;
      setOverlayBackRoute(null);
      setRoute(previous);
      return;
    }

    if (route.name === 'series' || route.name === 'lesson') {
      setRoute({ name: 'library' });
      return;
    }

    setRoute({ name: 'home' });
  }

  function updateReaderSettings(nextSettings: Partial<ReaderSettings>) {
    setStorage(current => ({
      ...current,
      readerSettings: {
        ...current.readerSettings,
        ...nextSettings,
      },
    }));
  }

  function updateThemeMode(themeMode: ReaderSettings['themeMode']) {
    updateReaderSettings({ themeMode });
  }

  function updateFontChoice(fontChoice: FontChoice) {
    updateReaderSettings({ fontChoice });
  }

  function updateReadingLanguage(readingLanguage: ReadingLanguage) {
    updateReaderSettings({ readingLanguage });
    const currentReadRoute =
      isReadRoute(route) || (overlayBackRoute && isReadRoute(overlayBackRoute));
    if (currentReadRoute) {
      closeTransientUi();
      setOverlayBackRoute(null);
      setRoute({ name: 'library' });
    }
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

  function toggleFavorite(lessonSlug: string) {
    setStorage(current => {
      const exists = current.favorites.includes(lessonSlug);
      return {
        ...current,
        favorites: exists
          ? current.favorites.filter(slug => slug !== lessonSlug)
          : [lessonSlug, ...current.favorites],
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
      const lessonHighlights = current.highlights[lessonSlug] ?? [];
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
          [lessonSlug]: existing
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
      const lessonHighlights = current.highlights[lessonSlug] ?? [];

      return {
        ...current,
        highlights: {
          ...current.highlights,
          [lessonSlug]: lessonHighlights.filter(
            item => item.id !== highlightId,
          ),
        },
      };
    });
  }

  function updateProgress(lessonSlug: string, ratio: number) {
    setStorage(current => {
      const rounded = Math.max(0, Math.min(1, Number(ratio.toFixed(2))));
      const previous = current.progress[lessonSlug];

      if (previous && Math.abs(previous.ratio - rounded) < 0.04) {
        return current;
      }

      return {
        ...current,
        progress: {
          ...current.progress,
          [lessonSlug]: {
            ratio: rounded,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function updateNote(lessonSlug: string, value: string) {
    setStorage(current => ({
      ...current,
      notes: {
        ...current.notes,
        [lessonSlug]: value,
      },
    }));
  }

  let content: React.JSX.Element;
  const playbackStateValue = playbackState.state;
  const shouldShowMiniPlayer =
    !miniPlayerMinimized &&
    route.name !== 'audio' &&
    route.name !== 'video' &&
    Boolean(activeTrack) &&
    playbackStateValue !== undefined &&
    [State.Playing, State.Paused, State.Ready].includes(playbackStateValue);
  const settingsPreviewRoute =
    route.name === 'settings' ? overlayBackRoute : route;
  const settingsPreviewLesson =
    settingsPreviewRoute?.name === 'lesson'
      ? isRemoteReadingLanguage(storage.readerSettings.readingLanguage)
        ? getRemoteLessonForRoute(
            remoteLessons,
            remoteSeries.find(
              item =>
                item.slug === settingsPreviewRoute.seriesSlug &&
                isSameReadingLanguage(
                  item.language,
                  storage.readerSettings.readingLanguage,
                ),
            ) ?? null,
            storage.readerSettings.readingLanguage,
            settingsPreviewRoute.lessonSlug,
          )
        : getLessonBySlug(settingsPreviewRoute.lessonSlug)
      : null;

  if (route.name === 'series') {
    const series = isRemoteReadingLanguage(storage.readerSettings.readingLanguage)
      ? remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(
              item.language,
              storage.readerSettings.readingLanguage,
            ),
        )
      : getSeriesBySlug(route.seriesSlug);
    content = series ? (
      <SeriesScreen
        series={series}
        styles={styles}
        palette={palette}
        isLoadingLessons={
          isRemoteReadingLanguage(storage.readerSettings.readingLanguage) &&
          series.lessons.length === 0 &&
          remoteSeriesLoadingKey ===
            buildRemoteSeriesCacheKey(
              storage.readerSettings.readingLanguage,
              route.seriesSlug,
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
    ) : (
      <MissingState styles={styles} onBack={goBack} />
    );
  } else if (route.name === 'lesson') {
    const isRemoteReader = isRemoteReadingLanguage(
      storage.readerSettings.readingLanguage,
    );
    const series = isRemoteReader
      ? remoteSeries.find(
          item =>
            item.slug === route.seriesSlug &&
            isSameReadingLanguage(
              item.language,
              storage.readerSettings.readingLanguage,
            ),
        )
      : getSeriesBySlug(route.seriesSlug);
    const baseLesson = isRemoteReader ? null : getLessonBySlug(route.lessonSlug);
    const lesson = isRemoteReader
      ? getRemoteLessonForRoute(
          remoteLessons,
          series ?? null,
          storage.readerSettings.readingLanguage,
          route.lessonSlug,
        )
      : baseLesson
        ? getLessonForReadingLanguage(
            baseLesson,
            storage.readerSettings.readingLanguage,
          )
        : null;
    content =
      series && lesson ? (
        <LessonScreen
          lesson={lesson}
          seriesTitle={series.title}
          adjacent={
            isRemoteReader
              ? getRemoteAdjacentLessons(series, route.lessonSlug)
              : getAdjacentLessons(route.seriesSlug, route.lessonSlug)
          }
          note={storage.notes[route.lessonSlug] ?? ''}
          highlights={storage.highlights[route.lessonSlug] ?? []}
          isFavorite={storage.favorites.includes(route.lessonSlug)}
          progress={storage.progress[route.lessonSlug]}
          settings={storage.readerSettings}
          palette={palette}
          typography={typography}
          styles={styles}
          bottomChromeOffset={bottomChromeOffset}
          onBack={goBack}
          onOpenSaved={openSaved}
          onOpenReaderSheet={() => setReaderSheetOpen(true)}
          onToggleFavorite={() => toggleFavorite(route.lessonSlug)}
          onOpenLesson={lessonSlug => openLesson(route.seriesSlug, lessonSlug)}
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
        topSeries={topSeries}
        styles={styles}
        palette={palette}
        readingLanguage={storage.readerSettings.readingLanguage}
        loading={remoteCatalogLoading}
        searchOpen={activeSearch === 'library'}
        searchQuery={libraryQuery}
        onChangeSearchQuery={setLibraryQuery}
        onToggleSearch={() =>
          setActiveSearch(current => (current === 'library' ? null : 'library'))
        }
        onOpenSaved={openSaved}
        onOpenSettings={() => openSettings(true)}
        onOpenSeries={openSeries}
        onOpenLesson={openLesson}
      />
    );
  } else if (route.name === 'audio') {
    content = (
      <AudioLibraryScreen
        styles={styles}
        palette={palette}
        query={audioQuery}
        playbackRate={audioPlaybackRate}
        onChangePlaybackRate={setAudioPlaybackRate}
        onOpenFullscreenPlayer={() => setAudioPlayerOpen(true)}
      />
    );
  } else if (route.name === 'video') {
    content = (
      <VideoLibraryScreen
        styles={styles}
        palette={palette}
        query={videoQuery}
      />
    );
  } else if (route.name === 'saved') {
    content = (
      <SavedScreen
        styles={styles}
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
        savedSummary={savedSummary}
        cacheSummary={cacheSummary}
      />
    );
  } else {
    content = (
      <HomeScreen
        styles={styles}
        topSeries={topSeries}
        continueReadingItems={continueReadingItems}
        onOpenSeries={openSeries}
        onOpenLesson={openLesson}
        onOpenSaved={openSaved}
        onOpenSearch={() => {
          setRoute({ name: 'library' });
          setActiveSearch('library');
        }}
        onOpenSettings={() => openSettings(true)}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={palette.statusBar}
        backgroundColor={palette.background}
      />
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
          route={route}
          bottomOffset={bottomChromeOffset}
          onSelectTab={selectTab}
        />
        <ReaderControlsSheet
          open={readerSheetOpen}
          styles={styles}
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
      </View>
    </SafeAreaView>
  );
}

function getRouteKey(route: Route) {
  switch (route.name) {
    case 'series':
      return `${route.name}:${route.seriesSlug}`;
    case 'lesson':
      return `${route.name}:${route.seriesSlug}:${route.lessonSlug}`;
    default:
      return route.name;
  }
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
      series.slug === nextSeries.slug && series.language === nextSeries.language,
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

function getRemoteAdjacentLessons(
  series: ArchiveSeries,
  lessonSlug: string,
) {
  const index = series.lessons.findIndex(lesson => lesson.slug === lessonSlug);
  return {
    previous: index > 0 ? series.lessons[index - 1] : null,
    next:
      index >= 0 && index < series.lessons.length - 1
        ? series.lessons[index + 1]
        : null,
  };
}
