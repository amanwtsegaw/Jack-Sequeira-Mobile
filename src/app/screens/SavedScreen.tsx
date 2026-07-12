import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getLessonBySlug, type ArchiveLesson } from '../../data/archive';
import { type LessonHighlight } from '../../storage';
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
  highlightEntries,
  notes,
  onBack,
  onOpenLesson,
}: {
  styles: AppStyles;
  favoriteLessons: ArchiveLesson[];
  highlightEntries: Array<{ lessonSlug: string; highlight: LessonHighlight }>;
  notes: Array<{ lessonSlug: string; value: string }>;
  onBack: () => void;
  onOpenLesson: (seriesSlug: string, lessonSlug: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<
    'saved' | 'highlights' | 'notes'
  >('saved');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<
    string | null
  >(null);

  const highlightColors = useMemo(() => {
    const colors = new Set<string>();
    highlightEntries.forEach(entry => {
      if (entry.highlight.color) {
        colors.add(entry.highlight.color);
      }
    });
    return Array.from(colors);
  }, [highlightEntries]);

  const filteredHighlights = selectedHighlightColor
    ? highlightEntries.filter(
        entry => entry.highlight.color === selectedHighlightColor,
      )
    : highlightEntries;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      stickyHeaderIndices={[1]}
    >
      <GlassHeader
        styles={styles}
        title="Saved"
        leftAction={{ icon: '‹', label: 'Back', onPress: onBack }}
      />

      <View style={styles.savedStickyTabsWrap}>
        <View style={styles.savedTabRow}>
          <SavedTabButton
            styles={styles}
            label="Saved"
            active={activeSection === 'saved'}
            onPress={() => setActiveSection('saved')}
          />
          <SavedTabButton
            styles={styles}
            label="Highlights"
            active={activeSection === 'highlights'}
            onPress={() => setActiveSection('highlights')}
          />
          <SavedTabButton
            styles={styles}
            label="Notes"
            active={activeSection === 'notes'}
            onPress={() => setActiveSection('notes')}
          />
        </View>

        {activeSection === 'highlights' && highlightColors.length > 0 ? (
          <View style={styles.highlightFilterRow}>
            <Pressable
              onPress={() => setSelectedHighlightColor(null)}
              style={[
                styles.highlightFilterButton,
                styles.highlightFilterAllButton,
                selectedHighlightColor === null &&
                  styles.highlightFilterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.highlightFilterText,
                  selectedHighlightColor === null &&
                    styles.highlightFilterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {highlightColors.map(color => (
              <Pressable
                key={color}
                accessibilityLabel={`Show ${color} highlights`}
                onPress={() => setSelectedHighlightColor(color)}
                style={[
                  styles.highlightColorButton,
                  selectedHighlightColor === color &&
                    styles.highlightFilterButtonActive,
                ]}
              >
                <View
                  style={[
                    styles.highlightColorSwatch,
                    { backgroundColor: color },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {activeSection === 'saved' ? (
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
      ) : null}

      {activeSection === 'highlights' ? (
      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Highlights"
          subtitle={
            selectedHighlightColor
              ? 'Showing highlights with the selected color.'
              : 'Selections captured from the reader.'
          }
        />
        {filteredHighlights.length > 0 ? (
          filteredHighlights.map(entry => {
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
                <Text
                  style={[
                    styles.savedInsightText,
                    entry.highlight.color
                      ? [
                          styles.savedHighlightSnippet,
                          { backgroundColor: entry.highlight.color },
                        ]
                      : null,
                  ]}
                  numberOfLines={4}
                >
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
      ) : null}

      {activeSection === 'notes' ? (
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
      ) : null}
    </ScrollView>
  );
}

function SavedTabButton({
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
      onPress={onPress}
      style={[styles.savedTabButton, active && styles.savedTabButtonActive]}
    >
      <Text
        style={[styles.savedTabText, active && styles.savedTabTextActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </Pressable>
  );
}
