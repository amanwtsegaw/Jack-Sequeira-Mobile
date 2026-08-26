import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { type ArchiveLesson, archiveStats } from '../../data/archive';
import { type AudioCollection, type VideoItem } from '../../data/media';
import { type AppPalette } from '../../design';
import { formatStaticText, type StaticText } from '../../i18n/staticText';
import { type StorageState } from '../../storage';
import { type AppStyles } from '../styles';
import { VideoCard, VideoPlayerModal } from '../components/MediaPlayer';
import {
  GlassCard,
  GlassHeader,
  GlassStat,
  LessonRowCard,
  PillButton,
  SectionHeader,
} from '../components/Shared';

const heroImage = require('../../assets/images/Jacknjean.png');

export function HomeScreen({
  styles,
  palette,
  staticText,
  continueReadingItems,
  featuredReadings,
  featuredVideo,
  featuredAudioCollections,
  onBack,
  onOpenLesson,
  onOpenAudio,
  onOpenSaved,
  onOpenSearch,
  onOpenSettings,
}: {
  styles: AppStyles;
  palette: AppPalette;
  staticText: StaticText;
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  featuredReadings: ArchiveLesson[];
  featuredVideo: VideoItem | null;
  featuredAudioCollections: AudioCollection[];
  onBack?: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
  onOpenAudio: (collectionKey: string, trackFileName: string) => void;
  onOpenSaved: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}) {
  const floatValue = useRef(new Animated.Value(0)).current;
  const [activeVideo, setActiveVideo] = React.useState<VideoItem | null>(null);

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

      <ImageBackground
        source={heroImage}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroShade} />
        <View style={styles.heroTextScrim} />
        <View style={styles.heroTopRow}>
          <Animated.View
            style={[
              styles.floatingBook,
              { transform: [{ translateY: cardLift }, { rotate: '-4deg' }] },
            ]}
          >
            <View style={styles.bookStackBack} />
            <View style={styles.bookStackFront}>
              <Text style={styles.bookStackTitle}>
                {staticText.navigation.library}
              </Text>
              <Text style={styles.bookStackMeta}>Archive glass edition</Text>
            </View>
          </Animated.View>
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
              value={`${archiveStats.lessonCount}`}
            />
            <GlassStat
              styles={styles}
              label={staticText.settings.seriesEntries}
              value={`${archiveStats.seriesCount}`}
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
      </ImageBackground>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.home.continueReading}
          subtitle="Your active reading flow lives here."
        />
        {continueReadingItems.length > 0 ? (
          continueReadingItems.map(({ lesson, progress }) => (
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
          ))
        ) : (
          <Text style={styles.bodyMuted}>
            Open a lesson and your recents, progress, and saved highlights will
            collect here.
          </Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title={staticText.home.featuredSeries}
          subtitle="A starting point from each reading category."
        />
        {featuredReadings.map(lesson => (
          <LessonRowCard
            key={lesson.slug}
            styles={styles}
            title={lesson.title}
            meta={`${lesson.seriesTitle} • ${lesson.readingTimeLabel}`}
            description={lesson.preview}
            accent="RD"
            onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
          />
        ))}
      </GlassCard>

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
