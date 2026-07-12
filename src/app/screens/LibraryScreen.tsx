import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {
  getSeriesGroups,
  type ArchiveLesson,
  type ArchiveSeries,
} from '../../data/archive';
import {getReadingLanguageLabel, type AppPalette, type ReadingLanguage} from '../../design';
import {type AppStyles} from '../styles';
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
  topSeries,
  readingLanguage,
  loading,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onOpenSaved,
  onOpenSettings,
  onOpenSeries,
  onOpenLesson,
}: {
  styles: AppStyles;
  palette: AppPalette;
  topSeries: ArchiveSeries[];
  readingLanguage: ReadingLanguage;
  loading: boolean;
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenSeries: (seriesSlug: string) => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  const groups = getSeriesGroups();
  const trimmedQuery = searchQuery.trim();
  const searchResults = trimmedQuery
    ? getLessonMatches(topSeries, trimmedQuery)
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassHeader
        styles={styles}
        title="Reading Library"
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
          placeholder="Search chapters..."
        />
      ) : null}

      {loading ? (
        <GlassCard styles={styles}>
          <View style={styles.loadingStateRow}>
            <ActivityIndicator color={palette.primarySolid} />
            <Text style={styles.bodyMuted}>Loading chapters...</Text>
          </View>
        </GlassCard>
      ) : null}

      {trimmedQuery ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Chapter Results"
            subtitle={`${searchResults.length} matching chapters`}
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
              No chapters match the current search.
            </Text>
          )}
        </GlassCard>
      ) : (
        groups.map(group => {
        const items = topSeries.filter(series => series.category === group.key);

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
              <Text style={styles.bodyMuted}>
                {loading
                  ? 'Loading chapters...'
                  : `No ${getReadingLanguageLabel(
                    readingLanguage,
                  ).toLowerCase()} reading content is available in this group yet.`}
              </Text>
            )}
          </GlassCard>
        );
        })
      )}
    </ScrollView>
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
