import React from 'react';
import {ScrollView, Text} from 'react-native';
import {getSeriesGroups, type ArchiveSeries} from '../../data/archive';
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
  searchOpen,
  searchQuery,
  onChangeSearchQuery,
  onToggleSearch,
  onOpenSaved,
  onOpenSettings,
  onOpenSeries,
}: {
  styles: AppStyles;
  palette: AppPalette;
  topSeries: ArchiveSeries[];
  readingLanguage: ReadingLanguage;
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
              <Text style={styles.bodyMuted}>
                {searchQuery.trim()
                  ? 'No series in this group match the current search.'
                  : `No ${getReadingLanguageLabel(
                      readingLanguage,
                    ).toLowerCase()} reading content is available in this group yet.`}
              </Text>
            )}
          </GlassCard>
        );
      })}
    </ScrollView>
  );
}
