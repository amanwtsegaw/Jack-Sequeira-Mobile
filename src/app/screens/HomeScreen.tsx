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
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  featuredReadings: ArchiveLesson[];
  featuredVideo: VideoItem | null;
  featuredAudioCollections: AudioCollection[];
  onBack?: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
  onOpenAudio: () => void;
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
        title="Home"
        leftAction={
          onBack ? { icon: '‹', label: 'Back', onPress: onBack } : undefined
        }
        actions={[
          { icon: '⌕', label: 'Search', onPress: onOpenSearch },
          { icon: '✦', label: 'Saved', onPress: onOpenSaved },
          { icon: 'Aa', label: 'Settings', onPress: onOpenSettings },
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
              <Text style={styles.bookStackTitle}>Read</Text>
              <Text style={styles.bookStackMeta}>Archive glass edition</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Faith-centered archive</Text>
          <Text style={styles.heroTitle}>
            The Gospel, the unconditional Love of God.
          </Text>
          <Text style={styles.heroDescription}>
            Browse sermons, open transcripts, keep highlights, and return to
            your recent studies with a warmer glass-driven reading experience.
          </Text>
          <View style={styles.heroStatsRow}>
            <GlassStat
              styles={styles}
              label="Lessons"
              value={`${archiveStats.lessonCount}`}
            />
            <GlassStat
              styles={styles}
              label="Series"
              value={`${archiveStats.seriesCount}`}
            />
            <GlassStat
              styles={styles}
              label="Continue"
              value={`${continueReadingItems.length}`}
            />
          </View>
          <View style={styles.heroButtonRow}>
            <PillButton
              styles={styles}
              label="Check our website"
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
          title="Continue Reading"
          subtitle="Your active reading flow lives here."
        />
        {continueReadingItems.length > 0 ? (
          continueReadingItems.map(({ lesson, progress }) => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={`${lesson.seriesTitle} • ${Math.round(
                (progress?.ratio ?? 0) * 100,
              )}% read`}
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
          title="Featured Readings"
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
            title="Featured Video"
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
          title="Featured Audio"
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
                onPress={onOpenAudio}
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
