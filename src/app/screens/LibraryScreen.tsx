import React from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  getSeriesGroups,
  type ArchiveLesson,
  type ArchiveSeries,
} from '../../data/archive';
import {
  getBibleStudyCourse,
  getBibleStudyCourseLessons,
  type BibleStudyCourse,
  type ResolvedBibleStudyCourseItem,
} from '../../data/bibleStudyCourse';
import {
  getReadingLanguageLabel,
  type AppPalette,
  type ReadingLanguage,
} from '../../design';
import { type StaticText } from '../../i18n/staticText';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  GlassSearchBar,
  SectionHeader,
  SeriesRowCard,
} from '../components/Shared';

type ReadSection = 'study-materials' | 'bible-courses';

export function LibraryScreen({
  styles,
  palette,
  staticText,
  topSeries,
  readingLanguage,
  loading,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
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
  readingLanguage: ReadingLanguage;
  loading: boolean;
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onBack?: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  const [activeSection, setActiveSection] =
    React.useState<ReadSection>('study-materials');
  const [switchWidth, setSwitchWidth] = React.useState(0);
  const switchProgress = React.useRef(new Animated.Value(0)).current;
  const groups = getSeriesGroups();
  const studyMaterialSeries = topSeries.filter(
    series => series.category !== 'bible-study',
  );
  const bibleCourseSeries = topSeries.filter(
    series => series.category === 'bible-study',
  );
  const bibleStudyCourse = React.useMemo(() => getBibleStudyCourse(), []);
  const bibleStudyCourseLessons = React.useMemo(
    () => getBibleStudyCourseLessons(),
    [],
  );
  const bibleStudySearchSeries = React.useMemo(
    () => buildBibleStudySearchSeries(bibleStudyCourse, bibleStudyCourseLessons),
    [bibleStudyCourse, bibleStudyCourseLessons],
  );
  const activeSeries =
    activeSection === 'bible-courses'
      ? [bibleStudySearchSeries]
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
          { icon: '✦', label: staticText.navigation.saved, onPress: onOpenSaved },
          { icon: 'Aa', label: staticText.navigation.settings, onPress: onOpenSettings },
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
        <GlassCard styles={styles}>
          <View style={styles.loadingStateRow}>
            <ActivityIndicator color={palette.primarySolid} />
            <Text style={styles.bodyMuted}>{staticText.library.loading}</Text>
          </View>
        </GlassCard>
      ) : null}

      {trimmedQuery ? (
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
                  onOpenLesson(result.lesson.seriesSlug, result.lesson.slug)
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
            <Text style={styles.bodyMuted}>
              {staticText.library.noResults}
            </Text>
          )}
        </GlassCard>
      ) : activeSection === 'bible-courses' ? (
        <BibleCoursesSection
          styles={styles}
          bibleStudyCourse={bibleStudyCourse}
          courseSeries={bibleCourseSeries}
          onOpenSeries={onOpenSeries}
          onOpenLesson={onOpenLesson}
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
            .map(group => {
              const items = studyMaterialSeries.filter(
                series => series.category === group.key,
              );

              return (
                <GlassCard key={group.key} styles={styles}>
                  <SectionHeader
                    styles={styles}
                    title={group.title}
                    subtitle={group.description}
                  />
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
                    <Text style={styles.bodyMuted}>
                      {loading
                        ? staticText.library.loading
                        : `No ${getReadingLanguageLabel(
                            readingLanguage,
                          ).toLowerCase()} reading content is available in this group yet.`}
                    </Text>
                  )}
                </GlassCard>
              );
            })}
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

function BibleCoursesSection({
  styles,
  bibleStudyCourse,
  courseSeries,
  onOpenSeries,
  onOpenLesson,
}: {
  styles: AppStyles;
  bibleStudyCourse: BibleStudyCourse;
  courseSeries: ArchiveSeries[];
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  function openCourseItem(item: ResolvedBibleStudyCourseItem) {
    if (item.localLesson) {
      onOpenLesson(item.localLesson.seriesSlug, item.localLesson.slug);
      return;
    }

    Linking.openURL(item.documentUrl).catch(() => undefined);
  }

  function openSupplement(url: string) {
    Linking.openURL(url).catch(() => undefined);
  }

  return (
    <>
      <GlassCard styles={styles}>
        <View style={styles.courseHeroTopRow}>
          <View style={styles.courseHeroDot} />
          <Text style={styles.eyebrow}>Bible Study Courses</Text>
        </View>
        <Text style={styles.courseHeroTitle}>Savior of the World</Text>
        <Text style={styles.bodyMuted}>{bibleStudyCourse.scripture}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.readStatPill}>
            {bibleStudyCourse.totalResources} resources
          </Text>
          <Text style={styles.readStatPill}>
            {bibleStudyCourse.localReaderResources} reader lessons
          </Text>
          <Text style={styles.readStatPill}>PDF and HTML documents</Text>
        </View>
        <View style={styles.courseSupplementGrid}>
          {[bibleStudyCourse.fullCourse, bibleStudyCourse.printableHtml, bibleStudyCourse.whereNext].map(
            supplement => (
              <Pressable
                key={supplement.fileName}
                onPress={() => openSupplement(supplement.documentUrl)}
                style={styles.courseSupplementButton}
              >
                <Text style={styles.courseSupplementTitle}>
                  {supplement.title}
                </Text>
                <Text style={styles.courseSupplementMeta}>
                  {supplement.fileName}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      </GlassCard>

      {courseSeries.length > 0 ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Online Reading Series"
            subtitle="Read each course lesson by lesson."
          />
          {courseSeries.map(series => (
            <SeriesRowCard
              key={series.slug}
              styles={styles}
              title={series.title}
              description={series.description}
              meta={`${series.lessonCount} lessons • Course series`}
              onPress={() => onOpenSeries(series.slug)}
            />
          ))}
        </GlassCard>
      ) : null}

      {bibleStudyCourse.sections.map((section, sectionIndex) => (
        <GlassCard key={section.title} styles={styles}>
          <View style={styles.courseSectionHeaderRow}>
            <View style={styles.courseSectionBadge}>
              <Text style={styles.courseSectionBadgeText}>
                {sectionIndex + 1}
              </Text>
            </View>
            <View style={styles.courseSectionTitleWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.bodyMuted}>{section.items.length} resources</Text>
            </View>
          </View>
          {section.items.map(item => (
            <Pressable
              key={`${section.title}-${item.code}-${item.fileName}`}
              onPress={() => openCourseItem(item)}
              style={styles.courseLessonCard}
            >
              <View style={styles.courseLessonCode}>
                <Text style={styles.courseLessonCodeText}>{item.code}</Text>
              </View>
              <View style={styles.listCardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.bodyMuted} numberOfLines={2}>
                  {item.localLesson
                    ? item.localLesson.description || item.localLesson.preview
                    : `Open ${item.type.toUpperCase()} document: ${item.fileName}`}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.readStatPill}>
                    {item.localLesson ? 'Reader' : item.type.toUpperCase()}
                  </Text>
                  <Text style={styles.readStatPill}>{item.fileName}</Text>
                </View>
              </View>
              <Text style={styles.courseLessonArrow}>→</Text>
            </Pressable>
          ))}
        </GlassCard>
      ))}
    </>
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

function buildBibleStudySearchSeries(
  bibleStudyCourse: BibleStudyCourse,
  lessons: ArchiveLesson[],
): ArchiveSeries {
  const readingTimeMinutes = lessons.reduce(
    (total, lesson) => total + lesson.readingTimeMinutes,
    0,
  );

  return {
    slug: 'bible-study-course',
    title: bibleStudyCourse.title,
    description: bibleStudyCourse.scripture,
    category: 'bible-study',
    language: 'en',
    lessonSlugs: lessons.map(lesson => lesson.slug),
    lessons,
    lessonCount: bibleStudyCourse.totalResources,
    categoryLabel: 'Bible Study Courses',
    readingTimeMinutes,
    readingTimeLabel: `${readingTimeMinutes} min total`,
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
