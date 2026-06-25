import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { StatusBar, View } from 'react-native';
import {
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  fontScaleOptions,
  getStepValue,
  lineHeightOptions,
  palettes,
  resolveTypography,
  type FontChoice,
} from './src/design';
import {
  getAdjacentLessons,
  getFeaturedSeries,
  getLessonBySlug,
  getRandomLesson,
  getSeriesBySlug,
  getTopSeries,
  type ArchiveLesson,
} from './src/data/archive';
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
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
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [overlayBackRoute, setOverlayBackRoute] = useState<Route | null>(null);
  const [storage, setStorage] = useState<StorageState>(defaultStorageState);
  const [hydrated, setHydrated] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SearchScope | null>(null);
  const [readerSheetOpen, setReaderSheetOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [audioQuery] = useState('');
  const [videoQuery] = useState('');
  const lastReadRouteRef = useRef<Route>({ name: 'library' });
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const miniPlayerProgress = useProgress(250);

  const deferredLibraryQuery = useDeferredValue(libraryQuery);

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
    if (isReadRoute(route)) {
      lastReadRouteRef.current = route;
    }
  }, [route]);

  const palette = palettes[storage.readerSettings.themeMode];
  const typography = resolveTypography(storage.readerSettings.fontChoice);
  const styles = createStyles(palette, typography);

  const topSeries = getTopSeries();
  const featuredSeries = getFeaturedSeries();

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

  const filteredSeries = topSeries.filter(series =>
    `${series.title} ${series.description} ${series.categoryLabel}`
      .toLowerCase()
      .includes(deferredLibraryQuery.trim().toLowerCase()),
  );

  function closeTransientUi() {
    setActiveSearch(null);
    setReaderSheetOpen(false);
  }

  function selectTab(tab: TabKey) {
    closeTransientUi();
    setOverlayBackRoute(null);
    switch (tab) {
      case 'home':
        setRoute({ name: 'home' });
        return;
      case 'library':
        setRoute(lastReadRouteRef.current);
        return;
      case 'audio':
        setRoute({ name: 'audio' });
        return;
      case 'video':
        setRoute({ name: 'video' });
        return;
      case 'settings':
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
    route.name !== 'video' &&
    Boolean(activeTrack) &&
    playbackStateValue !== undefined &&
    [State.Playing, State.Paused, State.Ready].includes(playbackStateValue);

  if (route.name === 'series') {
    const series = getSeriesBySlug(route.seriesSlug);
    content = series ? (
      <SeriesScreen
        series={series}
        styles={styles}
        palette={palette}
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
    const series = getSeriesBySlug(route.seriesSlug);
    const lesson = getLessonBySlug(route.lessonSlug);
    content =
      series && lesson ? (
        <LessonScreen
          lesson={lesson}
          seriesTitle={series.title}
          adjacent={getAdjacentLessons(route.seriesSlug, route.lessonSlug)}
          note={storage.notes[route.lessonSlug] ?? ''}
          highlights={storage.highlights[route.lessonSlug] ?? []}
          isFavorite={storage.favorites.includes(route.lessonSlug)}
          progress={storage.progress[route.lessonSlug]}
          settings={storage.readerSettings}
          palette={palette}
          typography={typography}
          styles={styles}
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
        topSeries={filteredSeries}
        styles={styles}
        palette={palette}
        searchOpen={activeSearch === 'library'}
        searchQuery={libraryQuery}
        onChangeSearchQuery={setLibraryQuery}
        onToggleSearch={() =>
          setActiveSearch(current => (current === 'library' ? null : 'library'))
        }
        onOpenSaved={openSaved}
        onOpenSettings={() => openSettings(false)}
        onOpenSeries={openSeries}
      />
    );
  } else if (route.name === 'audio') {
    content = (
      <AudioLibraryScreen
        styles={styles}
        palette={palette}
        query={audioQuery}
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
        continueReadingItems={continueReadingItems}
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
        onUpdateThemeMode={updateThemeMode}
        onUpdateFontChoice={updateFontChoice}
        onBumpFontScale={bumpFontScale}
        onBumpLineHeight={bumpLineHeight}
        onUpdateFontScaleByIndex={updateFontScaleByIndex}
        onUpdateLineHeightByIndex={updateLineHeightByIndex}
        onOpenSaved={openSaved}
        savedSummary={savedSummary}
      />
    );
  } else {
    content = (
      <HomeScreen
        styles={styles}
        palette={palette}
        featuredSeries={featuredSeries}
        topSeries={topSeries}
        continueReadingItems={continueReadingItems}
        onOpenSeries={openSeries}
        onOpenLesson={openLesson}
        onOpenSaved={openSaved}
        onOpenSearch={() => {
          setRoute({ name: 'library' });
          setActiveSearch('library');
        }}
        onOpenSettings={() => openSettings(false)}
        onRandomLesson={() => {
          const lesson = getRandomLesson();
          openLesson(lesson.seriesSlug, lesson.slug);
        }}
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
        {content}
        {shouldShowMiniPlayer ? (
          <GlobalAudioMiniPlayer
            styles={styles}
            palette={palette}
            track={activeTrack}
            playbackState={playbackStateValue}
            progress={miniPlayerProgress}
            onOpenAudio={() => selectTab('audio')}
          />
        ) : null}
        <BottomTabs
          styles={styles}
          palette={palette}
          route={route}
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
          onBumpFontScale={bumpFontScale}
          onBumpLineHeight={bumpLineHeight}
          onUpdateFontScaleByIndex={updateFontScaleByIndex}
          onUpdateLineHeightByIndex={updateLineHeightByIndex}
        />
      </View>
    </SafeAreaView>
  );
}
