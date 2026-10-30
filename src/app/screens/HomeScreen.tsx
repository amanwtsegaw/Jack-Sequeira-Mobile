import { AppText as Text } from '../../typography';
import React from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';
import { type ArchiveLesson, type ArchiveSeries } from '../../data/archive';
import { type AudioCollection, type VideoItem } from '../../data/media';
import { type ReadingLanguage, type AppPalette } from '../../design';
import { formatStaticText, type StaticText } from '../../i18n/staticText';
import { type StorageState } from '../../storage';
import { type AppStyles } from '../styles';
import { VideoCard, VideoPlayerModal } from '../components/MediaPlayer';
import {
  GlassCard,
  GlassHeader,
  GlassStat,
  LessonRowCard,
  SeriesRowCard,
  PillButton,
  SectionHeader,
} from '../components/Shared';

const heroImage = require('../../assets/images/Jacknjean.png');

export function HomeScreen({
  readingLanguage,
  styles,
  palette,
  staticText,
  continueReadingItems,
  lessonCount,
  seriesCount,
  featuredSeries,
  onOpenSeries,
  featuredVideo,
  featuredAudioCollections,
  onBack,
  onOpenLesson,
  onOpenAudio,
  onOpenSaved,
  onOpenSearch,
  onOpenSettings,
}: {
  readingLanguage: ReadingLanguage;
  lessonCount: number;
  seriesCount: number;
  styles: AppStyles;
  palette: AppPalette;
  staticText: StaticText;
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  featuredSeries: ArchiveSeries[];
  onOpenSeries: (slug: string) => void;
  featuredVideo: VideoItem | null;
  featuredAudioCollections: AudioCollection[];
  onBack?: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
  onOpenAudio: (collectionKey: string, trackFileName: string) => void;
  onOpenSaved: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}) {
  const [activeVideo, setActiveVideo] = React.useState<VideoItem | null>(null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GlassHeader
        styles={styles}
        title={staticText.navigation.home}
        leftAction={
          onBack
            ? { icon: '‹', label: staticText.navigation.back, onPress: onBack }
            : undefined
        }
        actions={[
          { icon: '⌕', label: 'Search', onPress: onOpenSearch },
          { icon: '✦', label: staticText.reader.saved, onPress: onOpenSaved },
          {
            icon: 'Aa',
            label: staticText.navigation.settings,
            onPress: onOpenSettings,
          },
        ]}
      />

      <View style={styles.hero}>
        <Image
          source={heroImage}
          blurRadius={28}
          style={styles.heroBackdropImage}
        />
        <Image source={heroImage} style={styles.heroImage} />
        <View pointerEvents="none" style={styles.heroTextScrim} />
        <View style={styles.heroTopRow}>
          {readingLanguage === 'en' ? (
            <View style={styles.floatingBook}>
              <View style={styles.bookStackBack} />
              <View style={styles.bookStackFront}>
                <Text style={styles.bookStackTitle}>Glass Edition</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>{staticText.home.heroEyebrow}</Text>
          <Text style={styles.heroTitle}>{staticText.home.heroTitle}</Text>
          <Text style={styles.heroDescription}>
            {staticText.home.heroDescription}
          </Text>
          <View style={styles.heroStatsRow}>
            <GlassStat
              styles={styles}
              label={staticText.common.lessons}
              value={`${lessonCount}`}
            />
            <GlassStat
              styles={styles}
              label={staticText.settings.seriesEntries}
              value={`${seriesCount}`}
            />
            <GlassStat
              styles={styles}
              label={staticText.reader.continue}
              value={`${continueReadingItems.length}`}
            />
          </View>
          <View style={styles.heroButtonRow}>
            <PillButton
              styles={styles}
              label={staticText.home.searchLibrary}
              onPress={() =>
                Linking.openURL('https://jacksequeira.org').catch(
                  () => undefined,
                )
              }
            />
          </View>
        </View>
      </View>

      {continueReadingItems.length > 0 ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title={staticText.home.continueReading}
            subtitle="Your active reading flow lives here."
          />
          {continueReadingItems.map(({ lesson, progress }) => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={`${lesson.seriesTitle} • ${formatStaticText(
                staticText.reader.percentRead,
                { percent: Math.round((progress?.ratio ?? 0) * 100) },
              )}`}
              description={lesson.preview}
              accent="RD"
              onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
            />
          ))}
        </GlassCard>
      ) : null}

      {featuredSeries.length > 0 ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title={staticText.home.featuredSeries}
            subtitle="A starting point from each reading category."
          />
          {featuredSeries.map(series => (
            <SeriesRowCard
              key={`${series.language}:${series.slug}`}
              styles={styles}
              title={series.title}
              description={series.description}
              meta={`${series.lessonCount} lessons`}
              onPress={() => onOpenSeries(series.slug)}
            />
          ))}
        </GlassCard>
      ) : null}

      {featuredVideo ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title={staticText.video.title}
            subtitle="One message selected from the video archive."
          />
          <VideoCard
            styles={styles}
            palette={palette}
            item={featuredVideo}
            showMeta={false}
            onPlay={() => setActiveVideo(featuredVideo)}
          />
        </GlassCard>
      ) : null}

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.audio.title}
          subtitle="A few messages from each audio collection."
        />
        {featuredAudioCollections.map(collection => (
          <View key={collection.key} style={styles.homeAudioGroup}>
            <Text style={styles.cardMeta}>{collection.title}</Text>
            {collection.tracks.map(track => (
              <LessonRowCard
                key={`${collection.key}-${track.fileName}`}
                styles={styles}
                title={track.title}
                meta={track.reference}
                description={collection.description}
                accent="AU"
                onPress={() => onOpenAudio(collection.key, track.fileName)}
              />
            ))}
          </View>
        ))}
      </GlassCard>

      <VideoPlayerModal
        styles={styles}
        item={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </ScrollView>
  );
}
