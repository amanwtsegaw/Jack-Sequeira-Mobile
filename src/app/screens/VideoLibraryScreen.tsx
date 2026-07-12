import React, {useState} from 'react';
import {Linking, ScrollView, Text, View} from 'react-native';
import {type AppPalette} from '../../design';
import {videoCollections, type VideoItem} from '../../data/media';
import {matchesQuery} from '../utils';
import {type AppStyles} from '../styles';
import {VideoCard, VideoPlayerModal} from '../components/MediaPlayer';
import {GhostButton, GlassCard, PillButton} from '../components/Shared';

export function VideoLibraryScreen({
  styles,
  palette,
  query,
}: {
  styles: AppStyles;
  palette: AppPalette;
  query: string;
}) {
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const filteredCollections = videoCollections
    .map(collection => ({
      ...collection,
      items: collection.items.filter(item =>
        matchesQuery(`${collection.title} ${item.title} ${item.reference ?? ''}`, query),
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
        <View style={styles.heroButtonRow}>
          <PillButton
            styles={styles}
            label="Open video archive online"
            onPress={() =>
              Linking.openURL('https://jacksequeira.org/videos.htm').catch(() => undefined)
            }
          />
        </View>
      </GlassCard>

      {filteredCollections.length > 0 ? (
        filteredCollections.map(collection => {
          const expanded = expandedCollections.includes(collection.key);
          const visibleItems = expanded ? collection.items : collection.items.slice(0, 3);

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
