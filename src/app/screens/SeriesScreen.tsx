import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { type ArchiveSeries } from '../../data/archive';
import { type AppPalette } from '../../design';
import { type StaticText } from '../../i18n/staticText';
import { matchesQuery } from '../utils';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  GlassSearchBar,
  InfoChip,
  LessonRowCard,
  SectionHeader,
} from '../components/Shared';

export function SeriesScreen({
  styles,
  palette,
  staticText,
  series,
  isLoadingLessons,
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onBack,
  onOpenSaved,
  onOpenLesson,
}: {
  styles: AppStyles;
  palette: AppPalette;
  staticText: StaticText;
  series: ArchiveSeries;
  isLoadingLessons?: boolean;
  searchOpen: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onToggleSearch: () => void;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  const filteredLessons = series.lessons.filter(lesson =>
    matchesQuery(
      `${lesson.title} ${lesson.description ?? ''} ${lesson.preview}`,
      searchQuery,
    ),
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassHeader
        styles={styles}
        title={series.shortTitle}
        leftAction={{ icon: '‹', label: staticText.navigation.back, onPress: onBack }}
        actions={[
          {
            icon: '⌕',
            label: 'Search',
            onPress: onToggleSearch,
            active: searchOpen,
          },
          { icon: '✦', label: staticText.navigation.saved, onPress: onOpenSaved },
        ]}
      />
      {searchOpen ? (
        <GlassSearchBar
          styles={styles}
          palette={palette}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          placeholder={staticText.library.searchPlaceholder}
        />
      ) : null}

      <GlassCard styles={styles}>
        <Text style={styles.screenTitle}>{series.title}</Text>
        <Text style={styles.bodyMuted}>{series.description}</Text>
        <View style={styles.metaRow}>
          <InfoChip
            styles={styles}
            label={`${series.lessonCount} ${staticText.common.lessons}`}
          />
          <InfoChip styles={styles} label={series.categoryLabel} />
          <InfoChip styles={styles} label={series.readingTimeLabel} />
        </View>
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.settings.lessons}
          subtitle={
            searchQuery.trim()
              ? `${filteredLessons.length} results`
              : staticText.library.tapLesson
          }
        />
        {isLoadingLessons ? (
          <View style={styles.loadingStateRow}>
            <ActivityIndicator color={palette.primarySolid} />
            <Text style={styles.bodyMuted}>{staticText.library.loading}</Text>
          </View>
        ) : null}
        {!isLoadingLessons &&
          filteredLessons.map((lesson, index) => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={`${staticText.common.lesson} ${index + 1} • ${
                lesson.readingTimeLabel
              }`}
              description={lesson.description || lesson.preview}
              accent="→"
              onPress={() => onOpenLesson(series.slug, lesson.slug)}
            />
          ))}
      </GlassCard>
    </ScrollView>
  );
}
