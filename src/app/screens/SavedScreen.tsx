import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { getLessonBySlug, type ArchiveLesson } from '../../data/archive';
import { type LessonHighlight, type StorageState } from '../../storage';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  LessonRowCard,
  SectionHeader,
} from '../components/Shared';

export function SavedScreen({
  styles,
  favoriteLessons,
  continueReadingItems,
  highlightEntries,
  notes,
  onBack,
  onOpenLesson,
}: {
  styles: AppStyles;
  favoriteLessons: ArchiveLesson[];
  continueReadingItems: Array<{
    lesson: ArchiveLesson;
    progress?: StorageState['progress'][string];
  }>;
  highlightEntries: Array<{ lessonSlug: string; highlight: LessonHighlight }>;
  notes: Array<{ lessonSlug: string; value: string }>;
  onBack: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassHeader
        styles={styles}
        title="Saved"
        leftAction={{ icon: '‹', label: 'Back', onPress: onBack }}
      />

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Saved Lessons"
          subtitle="Bookmarked for quick return."
        />
        {favoriteLessons.length > 0 ? (
          favoriteLessons.map(lesson => (
            <LessonRowCard
              key={lesson.slug}
              styles={styles}
              title={lesson.title}
              meta={lesson.seriesTitle}
              description={lesson.description || lesson.preview}
              accent="SV"
              onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
            />
          ))
        ) : (
          <Text style={styles.bodyMuted}>No saved lessons yet.</Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Recent Reading"
          subtitle="Keep moving from your latest sessions."
        />
        {continueReadingItems.length > 0 ? (
          continueReadingItems.map(({ lesson, progress }) => (
            <LessonRowCard
              key={`${lesson.slug}-recent`}
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
          <Text style={styles.bodyMuted}>No recent reading activity yet.</Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Highlights"
          subtitle="Selections captured from the reader."
        />
        {highlightEntries.length > 0 ? (
          highlightEntries.slice(0, 16).map(entry => {
            const lesson = getLessonBySlug(entry.lessonSlug);
            if (!lesson) {
              return null;
            }
            return (
              <Pressable
                key={entry.highlight.id}
                onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
                style={styles.savedInsightCard}
              >
                <Text style={styles.savedInsightTitle}>{lesson.title}</Text>
                <Text style={styles.savedInsightText} numberOfLines={4}>
                  {entry.highlight.text}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.bodyMuted}>
            Create highlights while reading a lesson.
          </Text>
        )}
      </GlassCard>

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Notes"
          subtitle="Short reflections stored with each lesson."
        />
        {notes.length > 0 ? (
          notes.slice(0, 12).map(entry => {
            const lesson = getLessonBySlug(entry.lessonSlug);
            if (!lesson) {
              return null;
            }
            return (
              <Pressable
                key={`${entry.lessonSlug}-note`}
                onPress={() => onOpenLesson(lesson.seriesSlug, lesson.slug)}
                style={styles.savedInsightCard}
              >
                <Text style={styles.savedInsightTitle}>{lesson.title}</Text>
                <Text style={styles.savedInsightText} numberOfLines={5}>
                  {entry.value}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.bodyMuted}>No saved notes yet.</Text>
        )}
      </GlassCard>
    </ScrollView>
  );
}
