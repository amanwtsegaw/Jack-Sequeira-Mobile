import React from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
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
import { buildInteractiveBibleStudy } from '../../data/interactiveBibleStudy';
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
  lessonProgress,
  studyResponses,
}: {
  styles: AppStyles;
  palette: AppPalette;
  staticText: StaticText;
  topSeries: ArchiveSeries[];
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
  lessonProgress: Record<string, { ratio: number; updatedAt: string }>;
  studyResponses: Record<string, Record<string, string>>;
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
  const bibleStudyCourse = React.useMemo(() => getBibleStudyCourse(), []);
  const bibleStudyCourseLessons = React.useMemo(
    () => getBibleStudyCourseLessons(),
    [],
  );
  const bibleStudySearchSeries = React.useMemo(
    () =>
      buildBibleStudySearchSeries(bibleStudyCourse, bibleStudyCourseLessons),
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
                  onOpenLesson(result.lesson.seriesSlug, result.lesson.slug, {
                    searchQuery: trimmedQuery,
                  })
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
        <BibleCoursesSection
          styles={styles}
          bibleStudyCourse={bibleStudyCourse}
          courseSeries={bibleCourseSeries}
          onOpenSeries={onOpenSeries}
          onOpenLesson={onOpenLesson}
          readingLanguage={readingLanguage}
          lessonProgress={lessonProgress}
          studyResponses={studyResponses}
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

function BibleCoursesSection({
  styles,
  bibleStudyCourse,
  courseSeries,
  onOpenSeries,
  onOpenLesson,
  readingLanguage,
  lessonProgress,
  studyResponses,
}: {
  styles: AppStyles;
  bibleStudyCourse: BibleStudyCourse;
  courseSeries: ArchiveSeries[];
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (
    seriesSlug: string,
    lessonSlug: string,
    options?: { librarySection?: ReadSection },
  ) => void;
  readingLanguage: ReadingLanguage;
  lessonProgress: Record<string, { ratio: number; updatedAt: string }>;
  studyResponses: Record<string, Record<string, string>>;
}) {
  function openCourseItem(item: ResolvedBibleStudyCourseItem) {
    if (item.localLesson) {
      onOpenLesson(item.localLesson.seriesSlug, item.localLesson.slug, {
        librarySection: 'bible-courses',
      });
      return;
    }

    onOpenSeries('bstudy');
  }

  const courseItems = bibleStudyCourse.sections.flatMap(
    section => section.items,
  );
  const introduction = courseItems.find(item => item.code === 'intro');
  const firstLesson = courseItems.find(item => item.code === '1');
  const itemActivity = courseItems.map(item => ({
    item,
    activity: getCourseItemActivity(
      item,
      readingLanguage,
      lessonProgress,
      studyResponses,
    ),
  }));
  const completedCount = itemActivity.filter(
    entry => entry.activity.state === 'complete',
  ).length;
  const continueEntry =
    itemActivity.find(
      entry =>
        entry.item.code !== 'intro' && entry.activity.state === 'in-progress',
    ) ??
    itemActivity.find(
      entry =>
        entry.item.code !== 'intro' && entry.activity.state !== 'complete',
    ) ??
    itemActivity.find(entry => entry.item.code !== 'intro');
  const coursePercent = courseItems.length
    ? Math.round((completedCount / courseItems.length) * 100)
    : 0;

  return (
    <>
      <GlassCard styles={styles}>
        <View style={styles.courseHeroTopRow}>
          <View style={styles.courseHeroDot} />
          <Text style={styles.eyebrow}>Bible Study Courses</Text>
        </View>
        <Text style={styles.courseHeroTitle}>Savior of the World</Text>
        <Text style={styles.bodyMuted}>{bibleStudyCourse.scripture}</Text>
        <View style={styles.courseStatsRow}>
          <CourseStat
            styles={styles}
            value={`${bibleStudyCourse.totalResources}`}
            label="Lessons"
          />
          <CourseStat
            styles={styles}
            value={`${completedCount}`}
            label="Complete"
          />
          <CourseStat
            styles={styles}
            value={`${coursePercent}%`}
            label="Progress"
          />
        </View>
        <View style={styles.courseProgressTrack}>
          <View
            style={[styles.courseProgressFill, { width: `${coursePercent}%` }]}
          />
        </View>
        <View style={styles.courseSupplementGrid}>
          {continueEntry?.item ?? firstLesson ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${
                completedCount > 0 ? 'Continue' : 'Start'
              } Savior of the World course`}
              onPress={() =>
                openCourseItem(continueEntry?.item ?? firstLesson!)
              }
              style={styles.coursePrimaryAction}
            >
              <View style={styles.coursePrimaryActionCopy}>
                <Text style={styles.coursePrimaryActionEyebrow}>
                  {completedCount > 0
                    ? 'Continue learning'
                    : 'Begin your study'}
                </Text>
                <Text style={styles.coursePrimaryActionTitle} numberOfLines={2}>
                  {continueEntry?.item.title ?? firstLesson?.title}
                </Text>
              </View>
              <Text style={styles.coursePrimaryActionArrow}>→</Text>
            </Pressable>
          ) : null}
          {introduction ? (
            <Pressable
              onPress={() => openCourseItem(introduction)}
              style={styles.courseIntroButton}
            >
              <Text style={styles.courseIntroButtonText}>Course overview</Text>
              <Text style={styles.courseIntroButtonMeta}>
                See the four-part learning path
              </Text>
            </Pressable>
          ) : null}
        </View>
      </GlassCard>

      {courseSeries.length > 0 ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Interactive Course Reader"
            subtitle="Study every lesson inside the app and keep your progress."
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
              <Text style={styles.courseSectionLabel}>
                Part {sectionIndex + 1}
              </Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.bodyMuted}>
                {section.items.length} resources
              </Text>
            </View>
          </View>
          {section.items.map(item => {
            const activity = getCourseItemActivity(
              item,
              readingLanguage,
              lessonProgress,
              studyResponses,
            );
            return (
              <Pressable
                key={`${section.title}-${item.code}-${item.fileName}`}
                onPress={() => openCourseItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${activity.label}`}
                style={({ pressed }) => [
                  styles.courseLessonCard,
                  activity.state === 'complete' &&
                    styles.courseLessonCardComplete,
                  pressed && styles.courseLessonCardPressed,
                ]}
              >
                <View style={styles.courseLessonCode}>
                  <Text style={styles.courseLessonCodeText}>{item.code}</Text>
                </View>
                <View style={styles.listCardBody}>
                  <View style={styles.courseLessonTitleRow}>
                    <Text style={styles.courseLessonTitle}>{item.title}</Text>
                    <Text style={styles.courseLessonArrow}>›</Text>
                  </View>
                  <Text style={styles.bodyMuted} numberOfLines={2}>
                    {item.localLesson
                      ? item.localLesson.description || item.localLesson.preview
                      : 'Open this lesson in the interactive course reader.'}
                  </Text>
                  <View style={styles.courseLessonMetaRow}>
                    <Text style={styles.courseLessonFormat}>
                      Interactive study
                    </Text>
                    <View style={styles.courseLessonMetaDot} />
                    <Text
                      style={[
                        styles.courseLessonStatus,
                        activity.state === 'complete' &&
                          styles.courseLessonStatusComplete,
                      ]}
                    >
                      {activity.label}
                    </Text>
                  </View>
                  <View style={styles.courseLessonProgressTrack}>
                    <View
                      style={[
                        styles.courseLessonProgressFill,
                        { width: `${activity.percent}%` },
                      ]}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </GlassCard>
      ))}
    </>
  );
}

function CourseStat({
  styles,
  value,
  label,
}: {
  styles: AppStyles;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.courseStatItem}>
      <Text style={styles.courseStatValue}>{value}</Text>
      <Text style={styles.courseStatLabel}>{label}</Text>
    </View>
  );
}

function getCourseItemActivity(
  item: ResolvedBibleStudyCourseItem,
  readingLanguage: ReadingLanguage,
  lessonProgress: Record<string, { ratio: number; updatedAt: string }>,
  studyResponses: Record<string, Record<string, string>>,
) {
  if (!item.localLesson) {
    return { state: 'not-started' as const, percent: 0, label: 'Not started' };
  }

  const key = `${readingLanguage}:${item.localLesson.slug}`;
  const readPercent = Math.round((lessonProgress[key]?.ratio ?? 0) * 100);
  const responses = studyResponses[key] ?? {};
  const answeredCount = Object.values(responses).filter(value =>
    value.trim(),
  ).length;
  const study = buildInteractiveBibleStudy(item.localLesson);
  const questionCount =
    study?.sections.reduce(
      (total, section) => total + section.questions.length,
      0,
    ) ?? 0;
  const answerPercent = questionCount
    ? Math.round((answeredCount / questionCount) * 100)
    : answeredCount > 0
    ? 100
    : 0;
  const percent = Math.max(readPercent, answerPercent);

  if (percent >= 95 || (questionCount > 0 && answeredCount >= questionCount)) {
    return { state: 'complete' as const, percent: 100, label: 'Completed' };
  }
  if (percent > 0 || answeredCount > 0) {
    return {
      state: 'in-progress' as const,
      percent,
      label:
        answeredCount > 0
          ? `${answeredCount}/${questionCount || answeredCount} answered`
          : `${percent}% read`,
    };
  }
  return { state: 'not-started' as const, percent: 0, label: 'Not started' };
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
