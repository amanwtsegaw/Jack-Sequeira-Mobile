import React, {useDeferredValue, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import TrackPlayer, {
  Capability,
  Event,
  State,
  TrackType,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import {WebView} from 'react-native-webview';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {BlockContent} from './src/components/BlockContent';
import {
  fontChoices,
  fontScaleOptions,
  getStepValue,
  getValueIndex,
  lineHeightOptions,
  palettes,
  resolveTypography,
  type AppPalette,
  type AppTypography,
  type FontChoice,
} from './src/design';
import {
  archiveStats,
  getAdjacentLessons,
  getFeaturedSeries,
  getLessonBySlug,
  getRandomLesson,
  getSeriesBySlug,
  getSeriesGroups,
  getTopSeries,
  type ArchiveLesson,
  type ArchiveSeries,
} from './src/data/archive';
import {
  audioCollections,
  videoCollections,
  type AudioTrack,
  type VideoItem,
} from './src/data/media';
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
  type LessonHighlight,
  type ReaderSettings,
  type StorageState,
} from './src/storage';
import {theme} from './src/theme';

type TabKey = 'home' | 'library' | 'audio' | 'video' | 'settings';
type SearchScope = 'library' | 'audio' | 'video';

type Route =
  | {name: 'home'}
  | {name: 'library'}
  | {name: 'audio'}
  | {name: 'video'}
  | {name: 'settings'}
  | {name: 'saved'}
  | {name: 'series'; seriesSlug: string}
  | {name: 'lesson'; seriesSlug: string; lessonSlug: string};

const heroImage = require('./src/assets/images/Jacknjean.png');

let trackPlayerSetupPromise: Promise<void> | null = null;

function isReadRoute(route: Route) {
  return (
    route.name === 'library' ||
    route.name === 'series' ||
    route.name === 'lesson' ||
    route.name === 'saved'
  );
}

async function ensureTrackPlayerSetup() {
  if (!trackPlayerSetupPromise) {
    trackPlayerSetupPromise = (async () => {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        progressUpdateEventInterval: 0.25,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });
    })().catch(error => {
      trackPlayerSetupPromise = null;
      throw error;
    });
  }

  return trackPlayerSetupPromise;
}

const tabItems: Array<{key: TabKey; label: string; icon: string}> = [
  {key: 'home', label: 'Home', icon: '⌂'},
  {key: 'library', label: 'Read', icon: '≡'},
  {key: 'audio', label: 'Audio', icon: '♫'},
  {key: 'video', label: 'Video', icon: '▷'},
  {key: 'settings', label: 'Settings', icon: 'Aa'},
];

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ArchiveApp />
    </SafeAreaProvider>
  );
}

function ArchiveApp() {
  const [route, setRoute] = useState<Route>({name: 'home'});
  const [overlayBackRoute, setOverlayBackRoute] = useState<Route | null>(null);
  const [storage, setStorage] = useState<StorageState>(defaultStorageState);
  const [hydrated, setHydrated] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SearchScope | null>(null);
  const [readerSheetOpen, setReaderSheetOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [audioQuery, setAudioQuery] = useState('');
  const [videoQuery, setVideoQuery] = useState('');
  const lastReadRouteRef = useRef<Route>({name: 'library'});
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
      return {lesson, progress: storage.progress[slug]};
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
      highlights.map(highlight => ({lessonSlug, highlight})),
    )
    .sort((left, right) =>
      right.highlight.createdAt.localeCompare(left.highlight.createdAt),
    );

  const groupedNotes = Object.entries(storage.notes ?? {})
    .filter(([, value]) => value.trim().length > 0)
    .map(([lessonSlug, value]) => ({lessonSlug, value}))
    .sort((left, right) => left.lessonSlug.localeCompare(right.lessonSlug));

  const filteredSeries = topSeries.filter(series =>
    matchesQuery(
      `${series.title} ${series.description} ${series.categoryLabel}`,
      deferredLibraryQuery,
    ),
  );

  function closeTransientUi() {
    setActiveSearch(null);
    setReaderSheetOpen(false);
  }

  function navigate(nextRoute: Route) {
    closeTransientUi();
    setOverlayBackRoute(null);
    setRoute(nextRoute);
  }

  function selectTab(tab: TabKey) {
    closeTransientUi();
    setOverlayBackRoute(null);
    switch (tab) {
      case 'home':
        setRoute({name: 'home'});
        return;
      case 'library':
        setRoute(lastReadRouteRef.current);
        return;
      case 'audio':
        setRoute({name: 'audio'});
        return;
      case 'video':
        setRoute({name: 'video'});
        return;
      case 'settings':
        setRoute({name: 'settings'});
        return;
    }
  }

  function openSeries(seriesSlug: string) {
    closeTransientUi();
    setRoute({name: 'series', seriesSlug});
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
    setRoute({name: 'lesson', seriesSlug, lessonSlug});
  }

  function openSaved() {
    setOverlayBackRoute(route);
    closeTransientUi();
    setRoute({name: 'saved'});
  }

  function openSettings(fromCurrentRoute = true) {
    setOverlayBackRoute(fromCurrentRoute ? route : null);
    closeTransientUi();
    setRoute({name: 'settings'});
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
      setRoute({name: 'library'});
      return;
    }

    setRoute({name: 'home'});
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
    updateReaderSettings({themeMode});
  }

  function updateFontChoice(fontChoice: FontChoice) {
    updateReaderSettings({fontChoice});
  }

  function updateFontScaleByIndex(index: number) {
    updateReaderSettings({
      fontScale: getStepValue(fontScaleOptions, index) as ReaderSettings['fontScale'],
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
    const currentIndex = getValueIndex(fontScaleOptions, storage.readerSettings.fontScale);
    updateFontScaleByIndex(currentIndex + direction);
  }

  function bumpLineHeight(direction: -1 | 1) {
    const currentIndex = getValueIndex(
      lineHeightOptions,
      storage.readerSettings.lineHeight,
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

  function toggleHighlight(lessonSlug: string, nextHighlight: {id: string; text: string}) {
    setStorage(current => {
      const lessonHighlights = current.highlights[lessonSlug] ?? [];
      const exists = lessonHighlights.some(item => item.id === nextHighlight.id);

      return {
        ...current,
        highlights: {
          ...current.highlights,
          [lessonSlug]: exists
            ? lessonHighlights.filter(item => item.id !== nextHighlight.id)
            : [
                {
                  id: nextHighlight.id,
                  text: nextHighlight.text,
                  createdAt: new Date().toISOString(),
                },
                ...lessonHighlights,
              ],
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
    route.name !== 'settings' &&
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
          onToggleHighlight={highlight => toggleHighlight(route.lessonSlug, highlight)}
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
          setRoute({name: 'library'});
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
    <SafeAreaView style={[styles.safeArea, {backgroundColor: palette.background}]} edges={['top', 'left', 'right']}>
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

function HomeScreen({
  styles,
  palette,
  featuredSeries,
  topSeries,
  continueReadingItems,
  onOpenSeries,
  onOpenLesson,
  onOpenSaved,
  onOpenSearch,
  onOpenSettings,
  onRandomLesson,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  featuredSeries: ArchiveSeries;
  topSeries: ArchiveSeries[];
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
  onOpenSaved: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onRandomLesson: () => void;
}) {
  const floatValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [floatValue]);

  const cardLift = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <GlassHeader
        styles={styles}
        title="Jack Sequeira"
        subtitle="Mobile archive"
        actions={[
          {icon: '⌕', label: 'Search', onPress: onOpenSearch},
          {icon: '✦', label: 'Saved', onPress: onOpenSaved},
          {icon: 'Aa', label: 'Settings', onPress: onOpenSettings},
        ]}
      />

      <ImageBackground source={heroImage} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <View style={styles.heroTopRow}>
          <Animated.View
            style={[
              styles.floatingBook,
              {transform: [{translateY: cardLift}, {rotate: '-4deg'}]},
            ]}>
            <View style={styles.bookStackBack} />
            <View style={styles.bookStackFront}>
              <Text style={styles.bookStackTitle}>Read</Text>
              <Text style={styles.bookStackMeta}>Archive glass edition</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Faith-centered archive</Text>
          <Text style={styles.heroTitle}>A calm home for reading, listening, and study.</Text>
          <Text style={styles.heroDescription}>
            Browse sermons, open transcripts, keep highlights, and return to your
            recent studies with a warmer glass-driven reading experience.
          </Text>
          <View style={styles.heroStatsRow}>
            <GlassStat styles={styles} label="Lessons" value={`${archiveStats.lessonCount}`} />
            <GlassStat styles={styles} label="Series" value={`${archiveStats.seriesCount}`} />
            <GlassStat styles={styles} label="Continue" value={`${continueReadingItems.length}`} />
          </View>
          <View style={styles.heroButtonRow}>
            <PillButton styles={styles} label="Open featured series" onPress={() => onOpenSeries(featuredSeries.slug)} />
            <GhostButton
              styles={styles}
              palette={palette}
              label="Random lesson"
              onPress={onRandomLesson}
            />
          </View>
        </View>
      </ImageBackground>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Continue Reading"
          subtitle="Your active reading flow lives here."
        />
        {continueReadingItems.length > 0 ? (
          continueReadingItems.map(({lesson, progress}) => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={`${lesson.seriesTitle} • ${Math.round(
                (progress?.ratio ?? 0) * 100,
              )}% read`}
              description={lesson.preview}
              accent="↗"
              onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
            />
          ))
        ) : (
          <Text style={styles.bodyMuted}>
            Open a lesson and your recents, progress, and saved highlights will collect here.
          </Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Featured Tracks"
          subtitle="Top reading collections from the archive."
        />
        {topSeries.slice(0, 4).map(series => (
          <SeriesRowCard
            key={series.slug}
            styles={styles}
            title={series.title}
            description={series.description}
            meta={`${series.lessonCount} lessons • ${series.readingTimeLabel}`}
            onPress={() => onOpenSeries(series.slug)}
          />
        ))}
      </GlassCard>
    </ScrollView>
  );
}

function LibraryScreen({
  styles,
  palette,
  topSeries,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onOpenSaved,
  onOpenSettings,
  onOpenSeries,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  topSeries: ArchiveSeries[];
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenSeries: (seriesSlug: string) => void;
}) {
  const groups = getSeriesGroups();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassHeader
        styles={styles}
        title="Reading Library"
        subtitle="Browse every collection with local search."
        actions={[
          {icon: '⌕', label: 'Search', onPress: onToggleSearch, active: searchOpen},
          {icon: '✦', label: 'Saved', onPress: onOpenSaved},
          {icon: 'Aa', label: 'Settings', onPress: onOpenSettings},
        ]}
      />
      {searchOpen ? (
        <GlassSearchBar
          styles={styles}
          palette={palette}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          placeholder="Search series and topics..."
        />
      ) : null}

      {groups.map(group => {
        const items = topSeries.filter(series => series.category === group.key);
        if (searchQuery.trim() && items.length === 0) {
          return null;
        }

        return (
          <GlassCard key={group.key} styles={styles}>
            <SectionHeader styles={styles} title={group.title} subtitle={group.description} />
            {items.length > 0 ? (
              items.map(series => (
                <SeriesRowCard
                  key={series.slug}
                  styles={styles}
                  title={series.title}
                  description={series.description}
                  meta={`${series.lessonCount} lessons • ${series.categoryLabel}`}
                  onPress={() => onOpenSeries(series.slug)}
                />
              ))
            ) : (
              <Text style={styles.bodyMuted}>No series in this group match the current search.</Text>
            )}
          </GlassCard>
        );
      })}
    </ScrollView>
  );
}

function SeriesScreen({
  styles,
  palette,
  series,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onBack,
  onOpenSaved,
  onOpenLesson,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  series: ArchiveSeries;
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  const filteredLessons = series.lessons.filter(lesson =>
    matchesQuery(`${lesson.title} ${lesson.description ?? ''} ${lesson.preview}`, searchQuery),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassHeader
        styles={styles}
        title={series.shortTitle}
        subtitle="Series lessons"
        leftAction={{icon: '‹', label: 'Back', onPress: onBack}}
        actions={[
          {icon: '⌕', label: 'Search', onPress: onToggleSearch, active: searchOpen},
          {icon: '✦', label: 'Saved', onPress: onOpenSaved},
        ]}
      />
      {searchOpen ? (
        <GlassSearchBar
          styles={styles}
          palette={palette}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          placeholder="Search inside this series..."
        />
      ) : null}

      <GlassCard styles={styles}>
        <Text style={styles.screenTitle}>{series.title}</Text>
        <Text style={styles.bodyMuted}>{series.description}</Text>
        <View style={styles.metaRow}>
          <InfoChip styles={styles} label={`${series.lessonCount} lessons`} />
          <InfoChip styles={styles} label={series.categoryLabel} />
          <InfoChip styles={styles} label={series.readingTimeLabel} />
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Lessons"
          subtitle={searchQuery.trim() ? `${filteredLessons.length} results` : 'Tap any lesson to open the reader.'}
        />
        {filteredLessons.map((lesson, index) => (
          <LessonRowCard
            key={lesson.slug}
            styles={styles}
            title={lesson.title}
            meta={`Lesson ${index + 1} • ${lesson.readingTimeLabel}`}
            description={lesson.description || lesson.preview}
            accent="→"
            onPress={() => onOpenLesson(series.slug, lesson.slug)}
          />
        ))}
      </GlassCard>
    </ScrollView>
  );
}

function LessonScreen({
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
  onToggleHighlight,
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
  styles: ReturnType<typeof createStyles>;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenReaderSheet: () => void;
  onToggleFavorite: () => void;
  onOpenLesson: (lessonSlug: string) => void;
  onToggleHighlight: (highlight: {id: string; text: string}) => void;
  onUpdateProgress: (ratio: number) => void;
  onUpdateNote: (value: string) => void;
}) {
  const [selectionMode, setSelectionMode] = useState(false);
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

    const maxOffset = Math.max(0, contentHeightRef.current - layoutHeightRef.current);
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

  return (
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
      }}>
      <View style={styles.stickyHeaderWrap}>
        <GlassHeader
          styles={styles}
          title="Reader"
          subtitle={seriesTitle}
          leftAction={{icon: '‹', label: 'Back', onPress: onBack}}
          actions={[
            {
              icon: selectionMode ? '●' : '◌',
              label: 'Select',
              onPress: () => setSelectionMode(current => !current),
              active: selectionMode,
            },
            {icon: '✦', label: 'Saved', onPress: onOpenSaved},
            {icon: 'Aa', label: 'Settings', onPress: onOpenReaderSheet},
          ]}
        />
      </View>

      <GlassCard styles={styles}>
        <Text style={styles.eyebrow}>{seriesTitle}</Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.bodyMuted}>{lesson.description || lesson.preview}</Text>
        <View style={styles.metaRow}>
          <InfoChip styles={styles} label={`${Math.round((progress?.ratio ?? 0) * 100)}% read`} />
          <InfoChip styles={styles} label={lesson.readingTimeLabel} />
          <InfoChip styles={styles} label={`${highlights.length} highlights`} />
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
        {selectionMode ? (
          <Text style={styles.helperText}>
            Selection mode is on. Tap any sentence-like text segment to highlight or unhighlight it.
          </Text>
        ) : null}
      </GlassCard>

      <GlassCard styles={styles}>
        <BlockContent
          blocks={lesson.blocks}
          lessonSlug={lesson.slug}
          settings={settings}
          highlights={highlights}
          selectionMode={selectionMode}
          palette={palette}
          typography={typography}
          onToggleHighlight={onToggleHighlight}
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
        <SectionHeader styles={styles} title="Continue" subtitle="Move through the series from here." />
        <View style={styles.navigationRow}>
          <View style={styles.navigationColumn}>
            <Text style={styles.navLabel}>Previous</Text>
            {adjacent.previous ? (
              <Pressable
                onPress={() => onOpenLesson(adjacent.previous!.slug)}
                style={styles.navLinkCard}>
                <Text style={styles.navLinkText}>{adjacent.previous.title}</Text>
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
                style={styles.navLinkCard}>
                <Text style={styles.navLinkText}>{adjacent.next.title}</Text>
              </Pressable>
            ) : (
              <Text style={styles.bodyMuted}>End of series</Text>
            )}
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

function AudioLibraryScreen({
  styles,
  palette,
  query,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  query: string;
}) {
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();
  const progress = useProgress(250);

  const activeTrackId =
    typeof activeTrack?.id === 'string' ? activeTrack.id : null;

  useEffect(() => {
    ensureTrackPlayerSetup().catch(() => undefined);
  }, []);

  // Surface playback failures (e.g. network/source errors) instead of
  // leaving the play button spinning forever.
  useTrackPlayerEvents([Event.PlaybackError], event => {
    setPendingTrackId(null);
    setPlaybackError(
      typeof event?.message === 'string' && event.message.length > 0
        ? event.message
        : 'Unable to play this audio. Check your connection and try again.',
    );
  });

  // Clear the loading spinner once the requested track has actually started
  // (or settled in a non-loading state).
  useEffect(() => {
    if (!pendingTrackId) {
      return;
    }
    if (activeTrackId === pendingTrackId) {
      const settledStates: Array<State | undefined> = [
        State.Playing,
        State.Paused,
        State.Ready,
        State.Stopped,
        State.Ended,
        State.Error,
      ];
      if (settledStates.includes(playbackState.state)) {
        setPendingTrackId(null);
      }
    }
  }, [pendingTrackId, activeTrackId, playbackState.state]);

  const filteredCollections = audioCollections
    .map(collection => ({
      ...collection,
      tracks: collection.tracks.filter(track =>
        matchesQuery(
          `${collection.title} ${track.title} ${track.reference} ${track.fileName}`,
          query,
        ),
      ),
    }))
    .filter(collection => collection.tracks.length > 0);

  function toggleCollection(key: string) {
    setExpandedCollections(current =>
      current.includes(key)
        ? current.filter(value => value !== key)
        : [...current, key],
    );
  }

  async function playTrack(collection: (typeof audioCollections)[number], track: AudioTrack) {
    const queue = buildAudioQueue(collection);
    const activeId = `${collection.key}-${track.fileName}`;
    const currentActiveId = activeTrackId;
    const currentState = playbackState.state;

    setPlaybackError(null);

    try {
      await ensureTrackPlayerSetup();

      if (currentActiveId === activeId) {
        if (currentState === State.Playing) {
          await TrackPlayer.pause();
        } else {
          setPendingTrackId(activeId);
          await TrackPlayer.play();
        }
        return;
      }

      setPendingTrackId(activeId);
      await TrackPlayer.reset();
      await TrackPlayer.add(queue);
      const nextIndex = queue.findIndex(item => item.id === activeId);
      if (nextIndex > 0) {
        await TrackPlayer.skip(nextIndex);
      }
      await TrackPlayer.play();
    } catch {
      setPendingTrackId(null);
      setPlaybackError(
        'Unable to start playback. Check your connection and try again.',
      );
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassCard styles={styles}>
        <Text style={styles.screenTitle}>Audio Sermons</Text>
        <Text style={styles.bodyMuted}>
          These entries point to the local audio archive on disk. Playback will move
          to backend-provided links later.
        </Text>
        <View style={styles.heroButtonRow}>
          <InfoChip styles={styles} label="80 local references" />
          <InfoChip styles={styles} label="4 scripture collections" />
          <PillButton
            styles={styles}
            label="Open audio archive online"
            onPress={() =>
              Linking.openURL('https://jacksequeira.org/audios.htm').catch(
                () => undefined,
              )
            }
          />
        </View>
      </GlassCard>

      {playbackError ? (
        <GlassCard styles={styles}>
          <Text style={styles.audioErrorText}>{playbackError}</Text>
        </GlassCard>
      ) : null}

      {filteredCollections.length > 0 ? (
        filteredCollections.map(collection => {
          const expanded = expandedCollections.includes(collection.key);
          const visibleTracks = expanded
            ? collection.tracks
            : collection.tracks.slice(0, 6);

          return (
            <GlassCard key={collection.key} styles={styles}>
              <View style={styles.mediaCollectionHeader}>
                <View style={styles.mediaCollectionTitleWrap}>
                  <Text style={styles.sectionTitle}>{collection.title}</Text>
                  <Text style={styles.bodyMuted}>{collection.description}</Text>
                </View>
                <View style={styles.mediaCountBadge}>
                  <Text style={styles.mediaCountBadgeText}>
                    {collection.tracks.length} tracks
                  </Text>
                </View>
              </View>

              {visibleTracks.map(track => {
                const trackId = `${collection.key}-${track.fileName}`;
                const isActiveTrack = activeTrackId === trackId;
                const loading =
                  pendingTrackId === trackId ||
                  (isActiveTrack &&
                    (playbackState.state === State.Buffering ||
                      playbackState.state === State.Loading));
                return (
                  <AudioTrackCard
                    key={trackId}
                    styles={styles}
                    palette={palette}
                    collectionKey={collection.key}
                    track={track}
                    activeTrackId={activeTrackId}
                    playbackState={playbackState.state}
                    progress={progress}
                    loading={loading}
                    onPlay={() => playTrack(collection, track)}
                  />
                );
              })}

              {collection.tracks.length > 6 ? (
                <GhostButton
                  styles={styles}
                  palette={palette}
                  label={expanded ? 'Show less' : 'See all tracks'}
                  onPress={() => toggleCollection(collection.key)}
                />
              ) : null}
            </GlassCard>
          );
        })
      ) : (
        <GlassCard styles={styles}>
          <Text style={styles.bodyMuted}>No audio references match this search.</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

function VideoLibraryScreen({
  styles,
  palette,
  query,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  query: string;
}) {
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const filteredCollections = videoCollections
    .map(collection => ({
      ...collection,
      items: collection.items.filter(item =>
        matchesQuery(
          `${collection.title} ${item.title} ${item.reference ?? ''}`,
          query,
        ),
      ),
    }))
    .filter(collection => collection.items.length > 0);

  function toggleCollection(key: string) {
    setExpandedCollections(current =>
      current.includes(key)
        ? current.filter(value => value !== key)
        : [...current, key],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassCard styles={styles}>
        <Text style={styles.screenTitle}>Video Sermons</Text>
        <Text style={styles.bodyMuted}>
          Video links come from the web archive. Each section starts with three
          messages and expands in place with a see more control.
        </Text>
        <View style={styles.heroButtonRow}>
          <InfoChip styles={styles} label="3 curated categories" />
          <InfoChip styles={styles} label="18 YouTube sermons" />
          <PillButton
            styles={styles}
            label="Open video archive online"
            onPress={() =>
              Linking.openURL('https://jacksequeira.org/videos.htm').catch(
                () => undefined,
              )
            }
          />
        </View>
      </GlassCard>

      {filteredCollections.length > 0 ? (
        filteredCollections.map(collection => {
          const expanded = expandedCollections.includes(collection.key);
          const visibleItems = expanded
            ? collection.items
            : collection.items.slice(0, 3);

          return (
            <GlassCard key={collection.key} styles={styles}>
              <View style={styles.mediaCollectionHeader}>
                <View style={styles.mediaCollectionTitleWrap}>
                  <Text style={styles.sectionTitle}>{collection.title}</Text>
                  <Text style={styles.bodyMuted}>{collection.description}</Text>
                </View>
                <View style={styles.mediaCountBadge}>
                  <Text style={styles.mediaCountBadgeText}>
                    {collection.items.length} videos
                  </Text>
                </View>
              </View>

              {visibleItems.map(item => (
                <VideoCard
                  key={item.id}
                  styles={styles}
                  palette={palette}
                  item={item}
                  onPlay={() => setActiveVideo(item)}
                />
              ))}

              {collection.items.length > 3 ? (
                <GhostButton
                  styles={styles}
                  palette={palette}
                  label={expanded ? 'Show less' : 'See more'}
                  onPress={() => toggleCollection(collection.key)}
                />
              ) : null}
            </GlassCard>
          );
        })
      ) : (
        <GlassCard styles={styles}>
          <Text style={styles.bodyMuted}>No video sermons match this search.</Text>
        </GlassCard>
      )}

      <VideoPlayerModal
        styles={styles}
        item={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </ScrollView>
  );
}

function AudioTrackCard({
  styles,
  palette,
  collectionKey,
  track,
  activeTrackId,
  playbackState,
  progress,
  loading,
  onPlay,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  collectionKey: string;
  track: AudioTrack;
  activeTrackId: string | null;
  playbackState: State | undefined;
  progress: {position: number; duration: number; buffered: number};
  loading: boolean;
  onPlay: () => void;
}) {
  const trackId = `${collectionKey}-${track.fileName}`;
  const isActive = activeTrackId === trackId;
  const isPlaying = isActive && playbackState === State.Playing;

  return (
    <View style={styles.audioTrackCard}>
      <View style={styles.audioTrackTopRow}>
        <View style={styles.audioTrackReferenceBadge}>
          <Text style={styles.audioTrackReferenceText}>{track.reference}</Text>
        </View>
        <Text style={styles.audioTrackExtension}>{track.extension.toUpperCase()}</Text>
      </View>
      <Text style={styles.cardTitle}>{track.title}</Text>
      <Text style={styles.audioTrackFileName}>{track.fileName}</Text>
      {isActive ? (
        <AudioTransportCard
          styles={styles}
          palette={palette}
          playing={isPlaying}
          loading={loading}
          position={progress.position}
          duration={progress.duration}
        />
      ) : null}
      <View style={styles.heroButtonRow}>
        <GhostButton
          styles={styles}
          palette={palette}
          label={
            loading
              ? 'Loading…'
              : isPlaying
              ? 'Pause audio'
              : 'Play audio'
          }
          loading={loading}
          onPress={onPlay}
        />
      </View>
    </View>
  );
}

function VideoCard({
  styles,
  palette,
  item,
  onPlay,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  item: VideoItem;
  onPlay: () => void;
}) {
  return (
    <View style={styles.videoCard}>
      <Pressable onPress={onPlay} style={styles.videoThumbnailWrap}>
        <Image source={{uri: item.thumbnailUrl}} style={styles.videoThumbnail} />
        <View style={styles.videoThumbnailOverlay}>
          <View style={styles.videoPlayButton}>
            <Text style={styles.videoPlayButtonText}>Play Fullscreen</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.videoCardBody}>
        <View style={styles.videoMetaRow}>
          <InfoChip styles={styles} label={item.duration} />
          {item.reference ? (
            <InfoChip styles={styles} label={item.reference} />
          ) : null}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.heroButtonRow}>
          <GhostButton
            styles={styles}
            palette={palette}
            label="Watch video"
            onPress={onPlay}
          />
        </View>
      </View>
    </View>
  );
}

function AudioTransportCard({
  styles,
  palette,
  playing,
  loading,
  position,
  duration,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  playing: boolean;
  loading?: boolean;
  position: number;
  duration: number;
}) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safePosition = Number.isFinite(position) ? Math.min(position, safeDuration || position) : 0;

  return (
    <View style={styles.audioTransportCard}>
      <View style={styles.audioTransportTopRow}>
        <Text style={styles.audioTransportState}>
          {playing ? 'Now Playing' : 'Ready to Resume'}
        </Text>
        <Text style={styles.audioTransportTime}>
          {formatPlaybackTime(safePosition)} / {formatPlaybackTime(safeDuration)}
        </Text>
      </View>

      <Slider
        style={styles.audioTransportSlider}
        minimumValue={0}
        maximumValue={safeDuration || 1}
        value={safePosition}
        minimumTrackTintColor={palette.primarySolid}
        maximumTrackTintColor="rgba(255,255,255,0.18)"
        thumbTintColor={palette.primarySolid}
        onSlidingComplete={value => {
          TrackPlayer.seekTo(value).catch(() => undefined);
        }}
      />

      <View style={styles.audioTransportControls}>
        <TransportButton
          styles={styles}
          palette={palette}
          icon="rewind15"
          onPress={() => TrackPlayer.seekBy(-15).catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="previous"
          onPress={() => TrackPlayer.skipToPrevious().catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon={playing ? 'pause' : 'play'}
          primary
          loading={loading}
          onPress={() =>
            (playing ? TrackPlayer.pause() : TrackPlayer.play()).catch(() => undefined)
          }
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="next"
          onPress={() => TrackPlayer.skipToNext().catch(() => undefined)}
        />
        <TransportButton
          styles={styles}
          palette={palette}
          icon="forward15"
          onPress={() => TrackPlayer.seekBy(15).catch(() => undefined)}
        />
      </View>
    </View>
  );
}

function TransportButton({
  styles,
  palette,
  icon,
  primary,
  loading,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  icon: 'rewind15' | 'previous' | 'play' | 'pause' | 'next' | 'forward15';
  primary?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.transportButton, primary && styles.transportButtonPrimary]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={primary ? palette.onPrimary : palette.primarySolid}
        />
      ) : (
        <TransportIcon styles={styles} icon={icon} primary={primary} />
      )}
    </Pressable>
  );
}

function TransportIcon({
  styles,
  icon,
  primary,
}: {
  styles: ReturnType<typeof createStyles>;
  icon: 'rewind15' | 'previous' | 'play' | 'pause' | 'next' | 'forward15';
  primary?: boolean;
}) {
  if (icon === 'play') {
    return (
      <View style={styles.transportIconWrap}>
        <View
          style={[
            styles.transportPlayTriangle,
            primary && styles.transportPlayTrianglePrimary,
          ]}
        />
      </View>
    );
  }

  if (icon === 'pause') {
    return (
      <View style={styles.transportIconWrap}>
        <View style={styles.transportPauseWrap}>
          <View
            style={[
              styles.transportPauseBar,
              primary && styles.transportPauseBarPrimary,
            ]}
          />
          <View
            style={[
              styles.transportPauseBar,
              primary && styles.transportPauseBarPrimary,
            ]}
          />
        </View>
      </View>
    );
  }

  if (icon === 'previous' || icon === 'next') {
    const reverse = icon === 'previous';
    return (
      <View
        style={[
          styles.transportIconWrap,
          reverse && styles.transportIconWrapReverse,
        ]}>
        <View style={styles.transportSkipBar} />
        <View
          style={[
            styles.transportSkipTriangle,
            primary && styles.transportSkipTrianglePrimary,
          ]}
        />
        <View
          style={[
            styles.transportSkipTriangle,
            styles.transportSkipTriangleTight,
            primary && styles.transportSkipTrianglePrimary,
          ]}
        />
      </View>
    );
  }

  const rewind = icon === 'rewind15';
  return (
    <View style={styles.transportSeekWrap}>
      <Text
        style={[
          styles.transportSeekGlyph,
          primary && styles.transportButtonTextPrimary,
        ]}>
        {rewind ? '↺' : '↻'}
      </Text>
      <Text
        style={[
          styles.transportSeekValue,
          primary && styles.transportButtonTextPrimary,
        ]}>
        15
      </Text>
    </View>
  );
}

function VideoPlayerModal({
  styles,
  item,
  onClose,
}: {
  styles: ReturnType<typeof createStyles>;
  item: VideoItem | null;
  onClose: () => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView
        style={styles.videoModalSafeArea}
        edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.videoModalPlayerWrap}>
          <Pressable onPress={onClose} style={styles.videoModalCloseButtonFloating}>
            <Text style={styles.videoModalCloseText}>Close</Text>
          </Pressable>
          <WebView
            style={styles.videoModalPlayer}
            source={{uri: getYoutubeWatchUrl(item.youtubeId)}}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            originWhitelist={['https://*', 'http://*']}
            onShouldStartLoadWithRequest={request => shouldStayInWebView(request.url)}
          />
        </View>

      </SafeAreaView>
    </Modal>
  );
}

function getYoutubeWatchUrl(youtubeId: string) {
  return `https://m.youtube.com/watch?v=${youtubeId}&autoplay=1&noapp=1`;
}

function shouldStayInWebView(url: string) {
  if (url.startsWith('youtube:') || url.startsWith('vnd.youtube:')) {
    return false;
  }
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }
  return true;
}

function buildAudioQueue(collection: (typeof audioCollections)[number]) {
  return collection.tracks.map(track => ({
    id: `${collection.key}-${track.fileName}`,
    title: track.title,
    artist: track.reference,
    album: collection.title,
    url: getAudioPlaybackUrl(track.fileName),
    type: TrackType.Default,
    contentType: getAudioContentType(track.extension),
  }));
}

function formatPlaybackTime(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getAudioPlaybackUrl(fileName: string) {
  return `https://jacksequeira.org/audio/${encodeURIComponent(fileName)}`;
}

function getAudioContentType(extension: string) {
  switch (extension.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wma':
      return 'audio/x-ms-wma';
    case 'm4a':
      return 'audio/mp4';
    case 'wav':
      return 'audio/wav';
    default:
      return 'audio/mpeg';
  }
}

function SavedScreen({
  styles,
  favoriteLessons,
  continueReadingItems,
  highlightEntries,
  notes,
  onBack,
  onOpenLesson,
}: {
  styles: ReturnType<typeof createStyles>;
  favoriteLessons: ArchiveLesson[];
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  highlightEntries: Array<{lessonSlug: string; highlight: LessonHighlight}>;
  notes: Array<{lessonSlug: string; value: string}>;
  onBack: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassHeader
        styles={styles}
        title="Highlights & Notes"
        subtitle="Saved moments from across the archive."
        leftAction={{icon: '‹', label: 'Back', onPress: onBack}}
      />

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Saved Lessons" subtitle="Bookmarked for quick return." />
        {favoriteLessons.length > 0 ? (
          favoriteLessons.map(lesson => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={lesson.seriesTitle}
              description={lesson.description || lesson.preview}
              accent="✦"
              onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
            />
          ))
        ) : (
          <Text style={styles.bodyMuted}>No saved lessons yet.</Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Recent Reading" subtitle="Keep moving from your latest sessions." />
        {continueReadingItems.length > 0 ? (
          continueReadingItems.map(({lesson, progress}) => (
            <LessonRowCard
              key={`${lesson.slug}-recent`}
              styles={styles}
              title={lesson.title}
              meta={`${lesson.seriesTitle} • ${Math.round(
                (progress?.ratio ?? 0) * 100,
              )}% read`}
              description={lesson.preview}
              accent="↗"
              onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
            />
          ))
        ) : (
          <Text style={styles.bodyMuted}>No recent reading activity yet.</Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Highlights" subtitle="Selections captured from the reader." />
        {highlightEntries.length > 0 ? (
          highlightEntries.slice(0, 16).map(entry => {
            const lesson = getLessonBySlug(entry.lessonSlug);
            if (!lesson) {
              return null;
            }
            return (
              <Pressable
                key={entry.highlight.id}
                onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
                style={styles.savedInsightCard}>
                <Text style={styles.savedInsightTitle}>{lesson.title}</Text>
                <Text style={styles.savedInsightText} numberOfLines={4}>
                  {entry.highlight.text}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.bodyMuted}>Turn on selection mode in the reader to create highlights.</Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Notes" subtitle="Short reflections stored with each lesson." />
        {notes.length > 0 ? (
          notes.slice(0, 12).map(entry => {
            const lesson = getLessonBySlug(entry.lessonSlug);
            if (!lesson) {
              return null;
            }
            return (
              <Pressable
                key={`${entry.lessonSlug}-note`}
                onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
                style={styles.savedInsightCard}>
                <Text style={styles.savedInsightTitle}>{lesson.title}</Text>
                <Text style={styles.savedInsightText} numberOfLines={5}>
                  {entry.value}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.bodyMuted}>No saved notes yet.</Text>
        )}
      </GlassCard>
    </ScrollView>
  );
}

function SettingsScreen({
  styles,
  settings,
  palette,
  onBack,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onBumpFontScale,
  onBumpLineHeight,
  onUpdateFontScaleByIndex,
  onUpdateLineHeightByIndex,
}: {
  styles: ReturnType<typeof createStyles>;
  settings: ReaderSettings;
  palette: AppPalette;
  onBack: () => void;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onBumpFontScale: (direction: -1 | 1) => void;
  onBumpLineHeight: (direction: -1 | 1) => void;
  onUpdateFontScaleByIndex: (index: number) => void;
  onUpdateLineHeightByIndex: (index: number) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassHeader
        styles={styles}
        title="Settings"
        subtitle="Theme, spacing, and reading fonts."
        leftAction={{icon: '‹', label: 'Back', onPress: onBack}}
      />

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Theme" subtitle="Choose the app mood." />
        <View style={styles.segmentedRow}>
          <SegmentButton
            styles={styles}
            label="Dark"
            active={settings.themeMode === 'dark'}
            onPress={() => onUpdateThemeMode('dark')}
          />
          <SegmentButton
            styles={styles}
            label="Sepia"
            active={settings.themeMode === 'sepia'}
            onPress={() => onUpdateThemeMode('sepia')}
          />
          <SegmentButton
            styles={styles}
            label="Light"
            active={settings.themeMode === 'light'}
            onPress={() => onUpdateThemeMode('light')}
          />
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Text Size" subtitle="Use the slider or step buttons." />
        <StepSliderControl
          styles={styles}
          palette={palette}
          valueLabel={labelForScale(settings.fontScale)}
          valueIndex={getValueIndex(fontScaleOptions, settings.fontScale)}
          maximum={fontScaleOptions.length - 1}
          onDecrease={() => onBumpFontScale(-1)}
          onIncrease={() => onBumpFontScale(1)}
          onChange={onUpdateFontScaleByIndex}
        />
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Line Height" subtitle="Control reading rhythm." />
        <StepSliderControl
          styles={styles}
          palette={palette}
          valueLabel={labelForLineHeight(settings.lineHeight)}
          valueIndex={getValueIndex(lineHeightOptions, settings.lineHeight)}
          maximum={lineHeightOptions.length - 1}
          onDecrease={() => onBumpLineHeight(-1)}
          onIncrease={() => onBumpLineHeight(1)}
          onChange={onUpdateLineHeightByIndex}
        />
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Reading Font"
          subtitle="Applied across reader and interface text."
        />
        <View style={styles.fontChoiceGrid}>
          {fontChoices.map(choice => (
            <Pressable
              key={choice.id}
              onPress={() => onUpdateFontChoice(choice.id)}
              style={[
                styles.fontChoiceCard,
                settings.fontChoice === choice.id && styles.fontChoiceCardActive,
              ]}>
              <Text style={styles.fontChoiceSample}>Aa</Text>
              <Text style={styles.fontChoiceLabel}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader styles={styles} title="Preview" subtitle="Current app-wide typography preview." />
        <Text style={styles.settingsPreviewHeading}>Grace, rhythm, and readability</Text>
        <Text
          style={[
            styles.settingsPreview,
            {
              fontSize: 18 * settings.fontScale,
              lineHeight: 18 * settings.fontScale * settings.lineHeight,
            },
          ]}>
          The selected font now applies throughout the app. Text size, line height, and
          theme stay in sync between the settings screen and the reader controls sheet.
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

function MissingState({
  styles,
  onBack,
}: {
  styles: ReturnType<typeof createStyles>;
  onBack: () => void;
}) {
  return (
    <View style={styles.centeredScreen}>
      <Text style={styles.sectionTitle}>Content not found</Text>
      <Text style={styles.bodyMuted}>
        This item could not be loaded from the local archive bundle.
      </Text>
      <PillButton styles={styles} label="Go back" onPress={onBack} />
    </View>
  );
}

function BottomTabs({
  styles,
  palette,
  route,
  onSelectTab,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  route: Route;
  onSelectTab: (tab: TabKey) => void;
}) {
  const active: TabKey =
    route.name === 'series' || route.name === 'lesson' || route.name === 'saved'
      ? 'library'
      : route.name === 'settings'
        ? 'settings'
        : route.name;

  return (
    <View style={styles.bottomTabsShell}>
      <BlurView
        style={styles.bottomTabsBlur}
        blurAmount={28}
        reducedTransparencyFallbackColor={palette.surfaceHigh}
        blurType={palette.blurTint}
      />
      <View style={styles.bottomTabsContent}>
        {tabItems.map(item => {
          const isActive = active === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectTab(item.key)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{item.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReaderControlsSheet({
  open,
  styles,
  settings,
  palette,
  onClose,
  onOpenFullSettings,
  onUpdateThemeMode,
  onUpdateFontChoice,
  onBumpFontScale,
  onBumpLineHeight,
  onUpdateFontScaleByIndex,
  onUpdateLineHeightByIndex,
}: {
  open: boolean;
  styles: ReturnType<typeof createStyles>;
  settings: ReaderSettings;
  palette: AppPalette;
  onClose: () => void;
  onOpenFullSettings: () => void;
  onUpdateThemeMode: (themeMode: ReaderSettings['themeMode']) => void;
  onUpdateFontChoice: (fontChoice: FontChoice) => void;
  onBumpFontScale: (direction: -1 | 1) => void;
  onBumpLineHeight: (direction: -1 | 1) => void;
  onUpdateFontScaleByIndex: (index: number) => void;
  onUpdateLineHeightByIndex: (index: number) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.sheetWrap}>
          <BlurView
            style={styles.sheetBlur}
            blurAmount={30}
            blurType={palette.blurTint}
            reducedTransparencyFallbackColor={palette.surfaceHigh}
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Reading Controls</Text>
              <Pressable onPress={onClose} style={styles.sheetCloseButton}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.segmentedRow}>
              <SegmentButton
                styles={styles}
                label="Dark"
                active={settings.themeMode === 'dark'}
                onPress={() => onUpdateThemeMode('dark')}
              />
              <SegmentButton
                styles={styles}
                label="Sepia"
                active={settings.themeMode === 'sepia'}
                onPress={() => onUpdateThemeMode('sepia')}
              />
              <SegmentButton
                styles={styles}
                label="Light"
                active={settings.themeMode === 'light'}
                onPress={() => onUpdateThemeMode('light')}
              />
            </View>

          <StepSliderControl
            styles={styles}
            palette={palette}
            label="Font size"
              valueLabel={labelForScale(settings.fontScale)}
              valueIndex={getValueIndex(fontScaleOptions, settings.fontScale)}
              maximum={fontScaleOptions.length - 1}
              onDecrease={() => onBumpFontScale(-1)}
              onIncrease={() => onBumpFontScale(1)}
              onChange={onUpdateFontScaleByIndex}
            />

          <StepSliderControl
            styles={styles}
            palette={palette}
            label="Line height"
              valueLabel={labelForLineHeight(settings.lineHeight)}
              valueIndex={getValueIndex(lineHeightOptions, settings.lineHeight)}
              maximum={lineHeightOptions.length - 1}
              onDecrease={() => onBumpLineHeight(-1)}
              onIncrease={() => onBumpLineHeight(1)}
              onChange={onUpdateLineHeightByIndex}
            />

            <View style={styles.inlineSection}>
              <Text style={styles.inlineSectionTitle}>Font</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineFontRow}>
                {fontChoices.map(choice => (
                  <Pressable
                    key={choice.id}
                    onPress={() => onUpdateFontChoice(choice.id)}
                    style={[
                      styles.inlineFontChip,
                      settings.fontChoice === choice.id && styles.inlineFontChipActive,
                    ]}>
                    <Text style={styles.inlineFontChipText}>{choice.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Pressable onPress={onOpenFullSettings} style={styles.fullSettingsButton}>
              <Text style={styles.fullSettingsText}>Open full settings</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StepSliderControl({
  styles,
  palette,
  label,
  valueLabel,
  valueIndex,
  maximum,
  onDecrease,
  onIncrease,
  onChange,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  label?: string;
  valueLabel: string;
  valueIndex: number;
  maximum: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.sliderSection}>
      {label ? (
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderValue}>{valueLabel}</Text>
        </View>
      ) : null}
      <View style={styles.sliderRow}>
        <Pressable onPress={onDecrease} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maximum}
          step={1}
          minimumTrackTintColor={palette.primarySolid}
          maximumTrackTintColor={palette.outline}
          thumbTintColor={palette.primarySolid}
          value={valueIndex}
          onValueChange={value => onChange(Math.round(value))}
        />
        <Pressable onPress={onIncrease} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GlassHeader({
  styles,
  title,
  subtitle,
  leftAction,
  actions = [],
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  subtitle: string;
  leftAction?: {icon: string; label: string; onPress: () => void};
  actions?: Array<{icon: string; label: string; onPress: () => void; active?: boolean}>;
}) {
  return (
    <View style={styles.headerShell}>
      <View style={styles.headerSide}>
        {leftAction ? <HeaderIconButton styles={styles} {...leftAction} /> : <View style={styles.headerSpacer} />}
      </View>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerActionRow}>
        {actions.map(action => (
          <HeaderIconButton key={`${action.label}-${action.icon}`} styles={styles} {...action} />
        ))}
      </View>
    </View>
  );
}

function HeaderIconButton({
  styles,
  icon,
  label,
  onPress,
  active,
}: {
  styles: ReturnType<typeof createStyles>;
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.headerIconButton, active && styles.headerIconButtonActive]}>
      <Text style={[styles.headerIconGlyph, active && styles.headerIconGlyphActive]}>
        {icon}
      </Text>
    </Pressable>
  );
}

function GlassCard({
  styles,
  children,
}: {
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
}) {
  return <View style={styles.glassCard}>{children}</View>;
}

function GlassSearchBar({
  styles,
  palette,
  value,
  onChangeText,
  placeholder,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={styles.searchInput}
      />
    </View>
  );
}

function SectionHeader({
  styles,
  title,
  subtitle,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.bodyMuted}>{subtitle}</Text>
    </View>
  );
}

function LessonRowCard({
  styles,
  title,
  meta,
  description,
  accent,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  meta: string;
  description: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.listCard}>
      <View style={styles.listCardIcon}>
        <Text style={styles.listCardIconText}>{accent}</Text>
      </View>
      <View style={styles.listCardBody}>
        <Text style={styles.cardMeta}>{meta}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.bodyMuted} numberOfLines={3}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function SeriesRowCard({
  styles,
  title,
  description,
  meta,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  description: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.seriesCard}>
      <Text style={styles.cardMeta}>{meta}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.bodyMuted}>{description}</Text>
    </Pressable>
  );
}

function SegmentButton({
  styles,
  label,
  active,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoChip({
  styles,
  label,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
}) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

function GlassStat({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PillButton({
  styles,
  label,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({
  styles,
  palette,
  label,
  loading,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={styles.secondaryButton}>
      <View style={styles.secondaryButtonContent}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={palette.primarySolid}
            style={styles.secondaryButtonSpinner}
          />
        ) : null}
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </View>
    </Pressable>
  );
}

function BackgroundGlow({styles}: {styles: ReturnType<typeof createStyles>}) {
  return (
    <>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <View style={styles.backgroundGlowThree} />
    </>
  );
}

function GlobalAudioMiniPlayer({
  styles,
  palette,
  track,
  playbackState,
  progress,
  onOpenAudio,
}: {
  styles: ReturnType<typeof createStyles>;
  palette: AppPalette;
  track: ReturnType<typeof useActiveTrack>;
  playbackState: State | undefined;
  progress: {position: number; duration: number; buffered: number};
  onOpenAudio: () => void;
}) {
  const trackTitle =
    typeof track?.title === 'string' && track.title.length > 0
      ? track.title
      : 'Audio message';
  const trackMeta =
    typeof track?.artist === 'string' && track.artist.length > 0
      ? track.artist
      : typeof track?.album === 'string' && track.album.length > 0
        ? track.album
        : 'Jack Sequeira';
  const isPlaying = playbackState === State.Playing;

  return (
    <View style={styles.miniPlayerShell} pointerEvents="box-none">
      <View style={styles.miniPlayerCard}>
        <Pressable onPress={onOpenAudio} style={styles.miniPlayerTextWrap}>
          <Text style={styles.miniPlayerEyebrow}>
            {isPlaying ? 'Now Playing' : 'Audio Ready'}
          </Text>
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>
            {trackTitle}
          </Text>
          <Text style={styles.miniPlayerMeta} numberOfLines={1}>
            {trackMeta} • {formatPlaybackTime(progress.position)}
          </Text>
        </Pressable>
        <View style={styles.miniPlayerActions}>
          <Pressable
            onPress={() =>
              (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(() => undefined)
            }
            style={styles.miniPlayerActionButton}>
            <Text style={styles.miniPlayerActionText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              TrackPlayer.reset().catch(() => undefined);
            }}
            style={[styles.miniPlayerActionButton, styles.miniPlayerCloseButton]}>
            <Text style={[styles.miniPlayerActionText, {color: palette.primarySolid}]}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function labelForScale(value: number) {
  const labels = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  return labels[getValueIndex(fontScaleOptions, value)] ?? 'M';
}

function labelForLineHeight(value: number) {
  const labels = ['Compact', 'Tight', 'Balanced', 'Open', 'Wide', 'Spacious'];
  return labels[getValueIndex(lineHeightOptions, value)] ?? 'Balanced';
}

function matchesQuery(value: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return value.toLowerCase().includes(normalized);
}

function createStyles(palette: AppPalette, typography: AppTypography) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    appShell: {
      flex: 1,
      backgroundColor: palette.background,
    },
    placeholder: {
      color: palette.muted,
    },
    sliderTint: {
      color: palette.primarySolid,
    },
    sliderTrack: {
      color: palette.outline,
    },
    backgroundGlowOne: {
      position: 'absolute',
      top: -120,
      right: -40,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: palette.glowOne,
    },
    backgroundGlowTwo: {
      position: 'absolute',
      top: 160,
      left: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: palette.glowTwo,
    },
    backgroundGlowThree: {
      position: 'absolute',
      bottom: 120,
      right: -30,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: palette.glowThree,
    },
    screen: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: 196,
      gap: theme.spacing.md,
    },
    stickyHeaderWrap: {
      paddingBottom: theme.spacing.xs,
      backgroundColor: palette.background,
    },
    headerShell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerSide: {
      minWidth: 44,
    },
    headerSpacer: {
      width: 44,
    },
    headerTextWrap: {
      flex: 1,
      gap: 3,
    },
    headerTitle: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 27,
      fontWeight: '700',
    },
    headerSubtitle: {
      color: palette.muted,
      fontFamily: typography.ui,
      fontSize: 13,
    },
    headerActionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    headerIconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    headerIconButtonActive: {
      backgroundColor: palette.primaryContainer,
      borderColor: palette.primary,
    },
    headerIconGlyph: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 18,
      fontWeight: '700',
    },
    headerIconGlyphActive: {
      color: palette.foreground,
    },
    hero: {
      minHeight: 470,
      borderRadius: 34,
      overflow: 'hidden',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceHigh,
    },
    heroImage: {
      resizeMode: 'cover',
    },
    heroShade: {
      ...StyleSheet.absoluteFill,
      backgroundColor: palette.heroShade,
    },
    heroTopRow: {
      padding: theme.spacing.lg,
      alignItems: 'flex-end',
    },
    floatingBook: {
      width: 140,
      height: 120,
    },
    bookStackBack: {
      position: 'absolute',
      top: 16,
      left: 10,
      right: 0,
      bottom: 0,
      borderRadius: 26,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    bookStackFront: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 12,
      bottom: 16,
      borderRadius: 26,
      backgroundColor: palette.surfaceHigh,
      borderWidth: 1,
      borderColor: palette.outline,
      padding: theme.spacing.md,
      justifyContent: 'space-between',
    },
    bookStackTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 24,
      fontWeight: '700',
    },
    bookStackMeta: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1.3,
    },
    heroContent: {
      padding: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    heroEyebrow: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.3,
    },
    heroTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 39,
      lineHeight: 44,
      fontWeight: '700',
      maxWidth: 320,
    },
    heroDescription: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 17,
      lineHeight: 27,
      maxWidth: 330,
    },
    heroStatsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    statCard: {
      flex: 1,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: 2,
    },
    statValue: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 21,
      fontWeight: '700',
    },
    statLabel: {
      color: palette.muted,
      fontFamily: typography.ui,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    heroButtonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    glassCard: {
      backgroundColor: palette.surfaceLowest,
      borderRadius: 30,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      shadowColor: palette.shadow,
      shadowOffset: {width: 0, height: 18},
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 8,
    },
    sectionHeader: {
      gap: 4,
    },
    sectionTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700',
    },
    screenTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 33,
      lineHeight: 37,
      fontWeight: '700',
    },
    lessonTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 31,
      lineHeight: 37,
      fontWeight: '700',
    },
    eyebrow: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    bodyMuted: {
      color: palette.mutedStrong,
      fontFamily: typography.reading,
      fontSize: 16,
      lineHeight: 25,
    },
    helperText: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 13,
      lineHeight: 19,
    },
    listCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'flex-start',
      borderRadius: 24,
      padding: theme.spacing.md,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    listCardIcon: {
      width: 50,
      height: 50,
      borderRadius: 18,
      backgroundColor: palette.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    listCardIconText: {
      color: palette.primarySolid,
      fontFamily: typography.ui,
      fontSize: 22,
      fontWeight: '700',
    },
    listCardBody: {
      flex: 1,
      gap: 4,
    },
    seriesCard: {
      borderRadius: 24,
      padding: theme.spacing.lg,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: 5,
    },
    cardMeta: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    cardTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 23,
      lineHeight: 28,
      fontWeight: '600',
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: 10,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 18,
      alignItems: 'center',
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    segmentButtonActive: {
      backgroundColor: palette.primaryContainer,
      borderColor: palette.primary,
    },
    segmentButtonText: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
    segmentButtonTextActive: {
      color: palette.foreground,
    },
    infoChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    infoChipText: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '600',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    toolbarRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    primaryButton: {
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 999,
      backgroundColor: palette.primarySolid,
    },
    primaryButtonText: {
      color: palette.onPrimary,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButton: {
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 999,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    secondaryButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonSpinner: {
      marginRight: 8,
    },
    secondaryButtonText: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
    audioErrorText: {
      color: palette.primarySolid,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
    searchWrap: {
      backgroundColor: palette.surfaceLowest,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      paddingHorizontal: 14,
    },
    searchInput: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 15,
      paddingVertical: 14,
    },
    sliderSection: {
      gap: 12,
    },
    sliderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sliderLabel: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 15,
      fontWeight: '700',
    },
    sliderValue: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '700',
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    stepButtonText: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 20,
      fontWeight: '700',
    },
    slider: {
      flex: 1,
      height: 32,
    },
    fontChoiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    fontChoiceCard: {
      width: '31%',
      minWidth: 96,
      borderRadius: 22,
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    fontChoiceCardActive: {
      backgroundColor: palette.primaryContainer,
      borderColor: palette.primary,
    },
    fontChoiceSample: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 30,
    },
    fontChoiceLabel: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    settingsPreviewHeading: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 22,
      fontWeight: '700',
    },
    settingsPreview: {
      color: palette.foreground,
      fontFamily: typography.reading,
    },
    noteInput: {
      minHeight: 160,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceLow,
      padding: theme.spacing.md,
      color: palette.foreground,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: typography.reading,
    },
    navigationRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    navigationColumn: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    navLabel: {
      color: palette.muted,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    navLinkCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceLow,
      padding: theme.spacing.md,
    },
    navLinkText: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
    },
    savedInsightCard: {
      borderRadius: 22,
      padding: theme.spacing.md,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: 6,
    },
    savedInsightTitle: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 15,
      fontWeight: '700',
    },
    savedInsightText: {
      color: palette.mutedStrong,
      fontFamily: typography.reading,
      fontSize: 15,
      lineHeight: 23,
    },
    mediaCollectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    mediaCollectionTitleWrap: {
      flex: 1,
      gap: 4,
    },
    mediaCountBadge: {
      borderRadius: 999,
      backgroundColor: palette.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    mediaCountBadgeText: {
      color: palette.primarySolid,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
    },
    audioTrackCard: {
      borderRadius: 24,
      padding: theme.spacing.md,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: 8,
    },
    audioTrackTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    audioTrackReferenceBadge: {
      borderRadius: 999,
      backgroundColor: palette.surfaceHigh,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    audioTrackReferenceText: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
    },
    audioTrackExtension: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
    },
    audioTrackFileName: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '600',
    },
    audioTrackPath: {
      color: palette.muted,
      fontFamily: typography.ui,
      fontSize: 12,
      lineHeight: 18,
    },
    videoCard: {
      borderRadius: 26,
      overflow: 'hidden',
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    videoThumbnailWrap: {
      height: 210,
      backgroundColor: palette.surfaceHigh,
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    videoThumbnailOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10, 14, 24, 0.22)',
    },
    videoPlayButton: {
      borderRadius: 999,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: 'rgba(255,255,255,0.88)',
    },
    videoPlayButtonText: {
      color: '#0e1726',
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    videoCardBody: {
      padding: theme.spacing.md,
      gap: 10,
    },
    videoMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    audioTransportCard: {
      borderRadius: 22,
      padding: theme.spacing.md,
      backgroundColor: palette.surfaceHigh,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: 10,
    },
    audioTransportTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    audioTransportState: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    audioTransportTime: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '600',
    },
    audioTransportSlider: {
      width: '100%',
      height: 28,
    },
    audioTransportControls: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: 6,
      justifyContent: 'space-between',
    },
    transportButton: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceLowest,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    transportButtonPrimary: {
      backgroundColor: palette.primarySolid,
      borderColor: palette.primarySolid,
    },
    transportButtonText: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 16,
      fontWeight: '700',
    },
    transportButtonTextPrimary: {
      color: palette.onPrimary,
    },
    transportIconWrap: {
      minHeight: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    transportIconWrapReverse: {
      flexDirection: 'row-reverse',
    },
    transportPlayTriangle: {
      width: 0,
      height: 0,
      borderTopWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 16,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: palette.foreground,
      marginLeft: 3,
    },
    transportPlayTrianglePrimary: {
      borderLeftColor: palette.onPrimary,
    },
    transportPauseWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    transportPauseBar: {
      width: 5,
      height: 18,
      borderRadius: 2,
      backgroundColor: palette.foreground,
    },
    transportPauseBarPrimary: {
      backgroundColor: palette.onPrimary,
    },
    transportSkipBar: {
      width: 4,
      height: 18,
      borderRadius: 2,
      backgroundColor: palette.foreground,
      marginRight: 2,
    },
    transportSkipTriangle: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 10,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: palette.foreground,
    },
    transportSkipTrianglePrimary: {
      borderLeftColor: palette.onPrimary,
    },
    transportSkipTriangleTight: {
      marginLeft: -3,
    },
    transportSeekWrap: {
      minHeight: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
    },
    transportSeekGlyph: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '900',
      lineHeight: 14,
    },
    transportSeekValue: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 10,
      fontWeight: '900',
      lineHeight: 11,
      marginTop: -1,
    },
    videoModalSafeArea: {
      flex: 1,
      backgroundColor: '#000000',
    },
    videoModalCloseText: {
      color: '#ffffff',
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '700',
    },
    videoModalPlayerWrap: {
      flex: 1,
      backgroundColor: '#000000',
    },
    videoModalCloseButtonFloating: {
      position: 'absolute',
      top: theme.spacing.lg,
      right: theme.spacing.lg,
      zIndex: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      backgroundColor: 'rgba(16,16,16,0.55)',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    videoModalPlayer: {
      flex: 1,
      backgroundColor: '#000000',
    },
    centeredScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
      paddingBottom: 90,
    },
    bottomTabsShell: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      borderRadius: 30,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      shadowColor: palette.shadow,
      shadowOffset: {width: 0, height: 16},
      shadowOpacity: 0.24,
      shadowRadius: 32,
      elevation: 10,
      backgroundColor: palette.surfaceLowest,
    },
    miniPlayerShell: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: 96,
      zIndex: 4,
    },
    miniPlayerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderRadius: 24,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
      backgroundColor: palette.surfaceHigh,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      shadowColor: palette.shadow,
      shadowOffset: {width: 0, height: 14},
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
    miniPlayerTextWrap: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    miniPlayerEyebrow: {
      color: palette.primary,
      fontFamily: typography.ui,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    miniPlayerTitle: {
      color: palette.foreground,
      fontFamily: typography.reading,
      fontSize: 16,
      fontWeight: '700',
    },
    miniPlayerMeta: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '600',
    },
    miniPlayerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    miniPlayerActionButton: {
      borderRadius: 999,
      backgroundColor: palette.surfaceLowest,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    miniPlayerCloseButton: {
      backgroundColor: palette.primaryContainer,
      borderColor: palette.primary,
    },
    miniPlayerActionText: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 12,
      fontWeight: '700',
    },
    bottomTabsBlur: {
      ...StyleSheet.absoluteFill,
    },
    bottomTabsContent: {
      flexDirection: 'row',
      padding: 8,
      backgroundColor: palette.surfaceLowest,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 20,
      alignItems: 'center',
      gap: 3,
    },
    tabButtonActive: {
      backgroundColor: palette.primarySolid,
    },
    tabIcon: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 18,
      fontWeight: '700',
    },
    tabIconActive: {
      color: palette.onPrimary,
    },
    tabLabel: {
      color: palette.mutedStrong,
      fontFamily: typography.ui,
      fontSize: 11,
      fontWeight: '700',
    },
    tabLabelActive: {
      color: palette.onPrimary,
    },
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.24)',
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheetWrap: {
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceLowest,
    },
    sheetBlur: {
      ...StyleSheet.absoluteFill,
    },
    sheetContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 16,
      backgroundColor: palette.surfaceLowest,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 46,
      height: 5,
      borderRadius: 999,
      backgroundColor: palette.outline,
      marginBottom: 2,
    },
    sheetHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetTitle: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 20,
      fontWeight: '700',
    },
    sheetCloseButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    sheetCloseText: {
      color: palette.primarySolid,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
    inlineSection: {
      gap: 10,
    },
    inlineSectionTitle: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 15,
      fontWeight: '700',
    },
    inlineFontRow: {
      gap: 10,
    },
    inlineFontChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: palette.surfaceLow,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    inlineFontChipActive: {
      backgroundColor: palette.primaryContainer,
      borderColor: palette.primary,
    },
    inlineFontChipText: {
      color: palette.foreground,
      fontFamily: typography.ui,
      fontSize: 13,
      fontWeight: '700',
    },
    fullSettingsButton: {
      marginTop: 4,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
      backgroundColor: palette.primarySolid,
    },
    fullSettingsText: {
      color: palette.onPrimary,
      fontFamily: typography.ui,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
