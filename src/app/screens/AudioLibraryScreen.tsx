import React, {useEffect, useState} from 'react';
import {Linking, ScrollView, Text, View} from 'react-native';
import TrackPlayer, {
  Event,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import {type AppPalette} from '../../design';
import {
  audioCollections,
  type AudioCollection,
  type AudioTrack,
} from '../../data/media';
import {ensureTrackPlayerSetup, buildAudioQueue} from '../player';
import {matchesQuery} from '../utils';
import {type AppStyles} from '../styles';
import {AudioTrackCard} from '../components/MediaPlayer';
import {GhostButton, GlassCard, InfoChip, PillButton} from '../components/Shared';

export function AudioLibraryScreen({
  styles,
  palette,
  query,
}: {
  styles: AppStyles;
  palette: AppPalette;
  query: string;
}) {
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();
  const progress = useProgress(250);

  const activeTrackId = typeof activeTrack?.id === 'string' ? activeTrack.id : null;

  useEffect(() => {
    ensureTrackPlayerSetup().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeTrackId) {
      return;
    }

    TrackPlayer.setRate(playbackRate).catch(() => undefined);
  }, [activeTrackId, playbackRate]);

  useTrackPlayerEvents([Event.PlaybackError], event => {
    setPendingTrackId(null);
    setPlaybackError(
      typeof event?.message === 'string' && event.message.length > 0
        ? event.message
        : 'Unable to play this audio. Check your connection and try again.',
    );
  });

  useEffect(() => {
    if (!pendingTrackId) {
      return;
    }
    if (activeTrackId === pendingTrackId) {
      const settledStates: Array<State | undefined> = [
        State.Playing,
        State.Paused,
        State.Ready,
        State.Stopped,
        State.Ended,
        State.Error,
      ];
      if (settledStates.includes(playbackState.state)) {
        setPendingTrackId(null);
      }
    }
  }, [pendingTrackId, activeTrackId, playbackState.state]);

  const filteredCollections = audioCollections
    .map(collection => ({
      ...collection,
      tracks: collection.tracks.filter(track =>
        matchesQuery(
          `${collection.title} ${track.title} ${track.reference} ${track.fileName}`,
          query,
        ),
      ),
    }))
    .filter(collection => collection.tracks.length > 0);

  function toggleCollection(key: string) {
    setExpandedCollections(current =>
      current.includes(key)
        ? current.filter(value => value !== key)
        : [...current, key],
    );
  }

  async function playTrack(collection: AudioCollection, track: AudioTrack) {
    const queue = buildAudioQueue(collection);
    const activeId = `${collection.key}-${track.fileName}`;
    const currentActiveId = activeTrackId;
    const currentState = playbackState.state;

    setPlaybackError(null);

    try {
      await ensureTrackPlayerSetup();
      const currentQueue = await TrackPlayer.getQueue();
      const hasQueuedTracks = currentQueue.length > 0;

      if (currentActiveId === activeId && hasQueuedTracks) {
        if (currentState === State.Playing) {
          await TrackPlayer.pause();
        } else {
          setPendingTrackId(activeId);
          if (currentState === State.Ended || currentState === State.Stopped) {
            await TrackPlayer.seekTo(0);
          }
          await TrackPlayer.play();
        }
        return;
      }

      setPendingTrackId(activeId);
      await TrackPlayer.reset();
      await TrackPlayer.add(queue);
      const nextIndex = queue.findIndex(item => item.id === activeId);
      if (nextIndex > 0) {
        await TrackPlayer.skip(nextIndex);
      }
      await TrackPlayer.setRate(playbackRate);
      await TrackPlayer.play();
    } catch {
      setPendingTrackId(null);
      setPlaybackError('Unable to start playback. Check your connection and try again.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <GlassCard styles={styles}>
        <Text style={styles.screenTitle}>Audio Sermons</Text>
        <Text style={styles.bodyMuted}>
          These entries point to the local audio archive on disk. Playback will move
          to backend-provided links later.
        </Text>
        <View style={styles.heroButtonRow}>
          <InfoChip styles={styles} label="80 local references" />
          <InfoChip styles={styles} label="4 scripture collections" />
          <PillButton
            styles={styles}
            label="Open audio archive online"
            onPress={() =>
              Linking.openURL('https://jacksequeira.org/audios.htm').catch(() => undefined)
            }
          />
        </View>
      </GlassCard>

      {playbackError ? (
        <GlassCard styles={styles}>
          <Text style={styles.audioErrorText}>{playbackError}</Text>
        </GlassCard>
      ) : null}

      {filteredCollections.length > 0 ? (
        filteredCollections.map(collection => {
          const expanded = expandedCollections.includes(collection.key);
          const visibleTracks = expanded ? collection.tracks : collection.tracks.slice(0, 6);

          return (
            <GlassCard key={collection.key} styles={styles}>
              <View style={styles.mediaCollectionHeader}>
                <View style={styles.mediaCollectionTitleWrap}>
                  <Text style={styles.sectionTitle}>{collection.title}</Text>
                  <Text style={styles.bodyMuted}>{collection.description}</Text>
                </View>
                <View style={styles.mediaCountBadge}>
                  <Text style={styles.mediaCountBadgeText}>
                    {collection.tracks.length} tracks
                  </Text>
                </View>
              </View>

              {visibleTracks.map(track => {
                const trackId = `${collection.key}-${track.fileName}`;
                const isActiveTrack = activeTrackId === trackId;
                const loading =
                  pendingTrackId === trackId ||
                  (isActiveTrack &&
                    (playbackState.state === State.Buffering ||
                      playbackState.state === State.Loading));
                return (
                  <AudioTrackCard
                    key={trackId}
                    styles={styles}
                    palette={palette}
                    collectionKey={collection.key}
                    track={track}
                    activeTrackId={activeTrackId}
                    playbackState={playbackState.state}
                    progress={progress}
                    loading={loading}
                    playbackRate={playbackRate}
                    onChangePlaybackRate={setPlaybackRate}
                    onPlay={() => playTrack(collection, track)}
                  />
                );
              })}

              {collection.tracks.length > 6 ? (
                <GhostButton
                  styles={styles}
                  palette={palette}
                  label={expanded ? 'Show less' : 'See all tracks'}
                  onPress={() => toggleCollection(collection.key)}
                />
              ) : null}
            </GlassCard>
          );
        })
      ) : (
        <GlassCard styles={styles}>
          <Text style={styles.bodyMuted}>No audio references match this search.</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}
