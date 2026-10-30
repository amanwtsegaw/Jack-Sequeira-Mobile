import { AppText as Text } from '../../typography';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import React from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {
  getSeriesGroups,
  type ArchiveLesson,
  type ArchiveSeries,
} from '../../data/archive';
import { type StudyRoomCourse } from '../../data/studyRoom';
import { BibleCourseCatalog } from '../components/BibleCourseCatalog';
import { blocksToPlainText } from '../../content/schema';
import {
  getReadingLanguageLabel,
  type AppPalette,
  type ReadingLanguage,
} from '../../design';
import { type StaticText } from '../../i18n/staticText';
import { type ReadSection } from '../navigation';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  GlassSearchBar,
  SectionHeader,
  SeriesRowCard,
} from '../components/Shared';

export function LibraryScreen({
  styles,
  palette,
  staticText,
  topSeries,
  bibleStudyCourse,
  onOpenStudyRoom,
  readingLanguage,
  initialSection = 'study-materials',
  loading,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onChangeSection,
  onBack,
  onOpenSaved,
  onOpenSettings,
  onOpenSeries,
  onOpenLesson,
}: {
  styles: AppStyles;
  palette: AppPalette;
  staticText: StaticText;
  topSeries: ArchiveSeries[];
  bibleStudyCourse: StudyRoomCourse;
  onOpenStudyRoom: (slug: string) => void;
  readingLanguage: ReadingLanguage;
  initialSection?: ReadSection;
  loading: boolean;
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onChangeSection?: (section: ReadSection) => void;
  onBack?: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (
    seriesSlug: string,
    lessonSlug: string,
    options?: { searchQuery?: string; librarySection?: ReadSection },
  ) => void;
}) {
  const [activeSection, setActiveSection] =
    React.useState<ReadSection>(initialSection);
  const [switchWidth, setSwitchWidth] = React.useState(0);
  const switchProgress = React.useRef(new Animated.Value(0)).current;
  const groups = getSeriesGroups();
  const studyMaterialSeries = topSeries.filter(
    series => series.category !== 'bible-study',
  );
  const bibleCourseSeries = topSeries.filter(
    series => series.category === 'bible-study',
  );
  const bibleStudySearchSeries = React.useMemo(
    () => buildBibleStudySearchSeries(bibleStudyCourse),
    [bibleStudyCourse],
  );
  const activeSeries =
    activeSection === 'bible-courses'
      ? readingLanguage === 'en'
        ? [bibleStudySearchSeries, ...bibleCourseSeries]
        : bibleCourseSeries
      : studyMaterialSeries;
  const trimmedQuery = searchQuery.trim();
  const searchResults = trimmedQuery
    ? getLessonMatches(activeSeries, trimmedQuery)
    : [];
  const studyLessonTotal = studyMaterialSeries.reduce(
    (total, series) => total + series.lessonCount,
    0,
  );

  React.useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  React.useEffect(() => {
    Animated.timing(switchProgress, {
      toValue: activeSection === 'bible-courses' ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeSection, switchProgress]);

  function handleSwitchLayout(event: LayoutChangeEvent) {
    setSwitchWidth(event.nativeEvent.layout.width);
  }

  function selectSection(section: ReadSection) {
    setActiveSection(section);
    onChangeSection?.(section);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassHeader
        styles={styles}
        title={staticText.library.title}
        leftAction={
          onBack
            ? { icon: '‹', label: staticText.navigation.back, onPress: onBack }
            : undefined
        }
        actions={[
          {
            icon: '⌕',
            label: 'Search',
            onPress: onToggleSearch,
            active: searchOpen,
          },
          {
            icon: '✦',
            label: staticText.navigation.saved,
            onPress: onOpenSaved,
          },
          {
            icon: 'Aa',
            label: staticText.navigation.settings,
            onPress: onOpenSettings,
          },
        ]}
      />
      <View style={styles.readSwitchWrap} onLayout={handleSwitchLayout}>
        {switchWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.readSwitchIndicator,
              {
                width: (switchWidth - 8) / 2,
                transform: [
                  {
                    translateX: switchProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (switchWidth - 8) / 2],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}
        <ReadSwitchButton
          styles={styles}
          label="Study Materials"
          active={activeSection === 'study-materials'}
          onPress={() => selectSection('study-materials')}
        />
        <ReadSwitchButton
          styles={styles}
          label="Bible Courses"
          active={activeSection === 'bible-courses'}
          onPress={() => selectSection('bible-courses')}
        />
      </View>
      {searchOpen ? (
        <GlassSearchBar
          styles={styles}
          palette={palette}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          placeholder={
            activeSection === 'bible-courses'
              ? 'Search Bible courses...'
              : staticText.library.searchPlaceholder
          }
        />
      ) : null}

      {loading ? (
        <LoadingSkeleton palette={palette} compact label="Loading library" />
      ) : null}

      {loading ? null : trimmedQuery ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Chapter Results"
            subtitle={`${searchResults.length} matching chapters in ${
              activeSection === 'bible-courses'
                ? 'Bible Courses'
                : 'Study Materials'
            }`}
          />
          {searchResults.length > 0 ? (
            searchResults.map(result => (
              <Pressable
                key={`${result.lesson.seriesSlug}:${result.lesson.slug}`}
                onPress={() =>
                  result.lesson.seriesSlug === 'bible-study-room'
                    ? onOpenStudyRoom(result.lesson.slug)
                    : onOpenLesson(
                        result.lesson.seriesSlug,
                        result.lesson.slug,
                        { searchQuery: trimmedQuery },
                      )
                }
                style={styles.searchResultCard}
              >
                <Text style={styles.cardMeta}>{result.lesson.seriesTitle}</Text>
                <HighlightedText
                  text={result.lesson.title}
                  query={trimmedQuery}
                  baseStyle={styles.cardTitle}
                  highlightStyle={styles.searchResultHighlight}
                />
                <HighlightedText
                  text={result.snippet}
                  query={trimmedQuery}
                  baseStyle={styles.bodyMuted}
                  highlightStyle={styles.searchResultHighlight}
                  numberOfLines={3}
                />
              </Pressable>
            ))
          ) : (
            <Text style={styles.bodyMuted}>{staticText.library.noResults}</Text>
          )}
        </GlassCard>
      ) : activeSection === 'bible-courses' ? (
        <BibleCourseCatalog
          styles={styles}
          course={bibleStudyCourse}
          language={readingLanguage}
          courseSeries={bibleCourseSeries}
          onOpenSeries={onOpenSeries}
          onOpenStudyRoom={onOpenStudyRoom}
        />
      ) : (
        <>
          <GlassCard styles={styles}>
            <Text style={styles.eyebrow}>Study Materials</Text>
            <Text style={styles.screenTitle}>Published Study Series</Text>
            <Text style={styles.bodyMuted}>
              Browse archived studies, doctrinal series, prophecy resources,
              sermon manuscripts, and verse-by-verse lessons from the ministry
              library.
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.readStatPill}>
                {studyMaterialSeries.length} published series
              </Text>
              <Text style={styles.readStatPill}>
                {studyLessonTotal} {staticText.common.lessons}
              </Text>
              <Text style={styles.readStatPill}>
                {getReadingLanguageLabel(readingLanguage)}
              </Text>
            </View>
          </GlassCard>
          {groups
            .filter(group => group.key !== 'bible-study')
            .map(group => ({
              ...group,
              items: studyMaterialSeries.filter(
                series => series.category === group.key,
              ),
            }))
            .filter(group => group.items.length > 0)
            .map(group => (
              <GlassCard key={group.key} styles={styles}>
                <SectionHeader
                  styles={styles}
                  title={group.title}
                  subtitle={group.description}
                />
                {group.items.map(series => (
                  <SeriesRowCard
                    key={series.slug}
                    styles={styles}
                    title={series.title}
                    description={series.description}
                    meta={`${series.lessonCount} lessons • ${series.categoryLabel}`}
                    onPress={() => onOpenSeries(series.slug)}
                  />
                ))}
              </GlassCard>
            ))}
        </>
      )}
    </ScrollView>
  );
}

function ReadSwitchButton({
  styles,
  label,
  active,
  onPress,
}: {
  styles: AppStyles;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.readSwitchButton}
    >
      <Text
        style={[
          styles.readSwitchButtonText,
          active && styles.readSwitchButtonTextActive,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getLessonMatches(seriesList: ArchiveSeries[], query: string) {
  const normalized = query.toLowerCase();

  return seriesList
    .flatMap(series =>
      series.lessons.map(lesson => {
        const haystack = `${lesson.title} ${lesson.description ?? ''} ${
          lesson.preview
        } ${lesson.searchableText}`.toLowerCase();
        if (!haystack.includes(normalized)) {
          return null;
        }

        return {
          lesson,
          snippet: buildSnippet(lesson, normalized),
        };
      }),
    )
    .filter(Boolean)
    .slice(0, 50) as Array<{ lesson: ArchiveLesson; snippet: string }>;
}

function buildBibleStudySearchSeries(course: StudyRoomCourse): ArchiveSeries {
  const lessons: ArchiveLesson[] = course.lessons.map((lesson, index) => {
    const searchableText = [
      lesson.title,
      lesson.description,
      ...(lesson.sourceIntroduction ?? []),
      ...lesson.objectives,
      ...lesson.sections.flatMap(section => [
        section.title,
        section.summary,
        ...section.questions.map(q => `${q.question} ${q.reference}`),
      ]),
      lesson.articleBlocks ? blocksToPlainText(lesson.articleBlocks) : '',
      lesson.responsePrompt,
    ].join(' ');
    return {
      slug: lesson.slug,
      seriesSlug: 'bible-study-room',
      title: lesson.title,
      sequence: index,
      description: lesson.description,
      keywords: [],
      blocks: [],
      sourcePath: `course:${lesson.slug}`,
      language: 'en',
      seriesTitle: course.title,
      preview: lesson.description,
      searchableText,
      readingTimeMinutes: lesson.estimatedMinutes,
      readingTimeLabel: `${lesson.estimatedMinutes} min study`,
    };
  });
  return {
    slug: 'bible-study-room',
    title: course.title,
    description: course.scripture,
    category: 'bible-study',
    language: 'en',
    lessons,
    lessonSlugs: lessons.map(lesson => lesson.slug),
    lessonCount: lessons.length,
    categoryLabel: 'Bible Study Courses',
    readingTimeMinutes: lessons.reduce(
      (sum, lesson) => sum + lesson.readingTimeMinutes,
      0,
    ),
    readingTimeLabel: 'Bible Study Course',
    shortTitle: 'Bible Study Course',
  };
}

function buildSnippet(lesson: ArchiveLesson, normalizedQuery: string) {
  const source = lesson.searchableText || lesson.description || lesson.preview;
  const index = source.toLowerCase().indexOf(normalizedQuery);
  if (index < 0) {
    return lesson.description || lesson.preview;
  }

  return source
    .slice(Math.max(0, index - 72), Math.min(source.length, index + 170))
    .trim();
}

function HighlightedText({
  text,
  query,
  baseStyle,
  highlightStyle,
  numberOfLines,
}: {
  text: string;
  query: string;
  baseStyle: object;
  highlightStyle: object;
  numberOfLines?: number;
}) {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index < 0) {
    return (
      <Text style={baseStyle} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={baseStyle} numberOfLines={numberOfLines}>
      {text.slice(0, index)}
      <Text style={highlightStyle}>
        {text.slice(index, index + query.length)}
      </Text>
      {text.slice(index + query.length)}
    </Text>
  );
}
