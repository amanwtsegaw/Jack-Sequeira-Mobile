import { AppText as Text } from '../../typography';
import { StudyCompletionToggle } from './StudyCompletionToggle';
import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { absoluteContentUrl, type StudyRoomCourse } from '../../data/studyRoom';
import { useStudyWorkbook } from '../../hooks/useStudyWorkbook';
import type { ArchiveSeries } from '../../data/archive';
import type { ReadingLanguage } from '../../design';
import type { AppStyles } from '../styles';
import { GlassCard, PillButton, SectionHeader, SeriesRowCard } from './Shared';

export function BibleCourseCatalog({
  course,
  language,
  courseSeries,
  styles,
  onOpenStudyRoom,
  onOpenSeries,
}: {
  course: StudyRoomCourse;
  language: ReadingLanguage;
  courseSeries: ArchiveSeries[];
  styles: AppStyles;
  onOpenStudyRoom: (slug: string) => void;
  onOpenSeries: (slug: string) => void;
}) {
  const { book, ready, update, activate } = useStudyWorkbook();
  const core = course.lessons.filter(lesson => /^\d+$/.test(lesson.code));
  const complete = core.filter(
    lesson => book.lessons[lesson.slug]?.complete,
  ).length;
  const active =
    course.lessons.find(lesson => lesson.slug === book.activeSlug) ??
    core.find(lesson => !book.lessons[lesson.slug]?.complete) ??
    core[0];
  function open(slug: string) {
    activate(slug);
    onOpenStudyRoom(slug);
  }
  return (
    <>
      {language === 'en' ? (
        <>
          <GlassCard styles={styles}>
            <Text style={styles.eyebrow}>Interactive Bible Study</Text>
            <Text style={styles.courseHeroTitle}>Savior of the World</Text>
            <Text style={styles.bodyMuted}>{course.scripture}</Text>
            <Text style={styles.bodyMuted}>
              Read Scripture, answer, then compare. Open each cited passage,
              write your own response, and reveal the original study guidance
              when you are ready.
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.readStatPill}>
                {core.length} core studies
              </Text>
              <Text style={styles.readStatPill}>
                {course.lessons.reduce(
                  (total, lesson) =>
                    total +
                    lesson.sections.reduce(
                      (sum, section) => sum + section.questions.length,
                      0,
                    ),
                  0,
                )}{' '}
                Bible questions
              </Text>
              <Text style={styles.readStatPill}>
                {course.parts.length} course parts
              </Text>
            </View>
            <SectionHeader
              styles={styles}
              title="Your progress"
              subtitle={`${complete} of ${core.length} studies complete · ${
                core.length ? Math.round((complete / core.length) * 100) : 0
              }%`}
            />
            <View
              style={{
                height: 6,
                borderRadius: 6,
                backgroundColor: '#88888830',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 6,
                  width: `${core.length ? (complete / core.length) * 100 : 0}%`,
                  backgroundColor: '#38ab8a',
                }}
              />
            </View>
            {active ? (
              <PillButton
                styles={styles}
                label={`Continue ${
                  active.code === 'intro'
                    ? 'Introduction'
                    : `Study ${active.code}`
                }`}
                onPress={() => open(active.slug)}
              />
            ) : null}
            <Text style={styles.helperText}>
              Answers, notes, and completion are saved privately on this device.
            </Text>
          </GlassCard>
          {course.sections.map(section => (
            <GlassCard key={section.title} styles={styles}>
              <SectionHeader
                styles={styles}
                title={section.title}
                subtitle={`${
                  section.items.filter(
                    item => book.lessons[item.routeSlug ?? '']?.complete,
                  ).length
                } of ${section.items.length} completed`}
              />
              {section.items.map(item => {
                const lesson = course.lessons.find(
                  value => value.slug === item.routeSlug,
                );
                const done = lesson
                  ? book.lessons[lesson.slug]?.complete
                  : false;
                return (
                  <View key={item.code} style={styles.courseStudyRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        lesson
                          ? open(lesson.slug)
                          : void Linking.openURL(
                              absoluteContentUrl(item.documentUrl),
                            ).catch(() => undefined)
                      }
                      style={styles.courseLessonCard}
                    >
                      <View style={styles.courseLessonCode}>
                        <Text style={styles.courseLessonCodeText}>
                          {item.code}
                        </Text>
                      </View>
                      <View style={styles.listCardBody}>
                        <Text style={styles.courseLessonTitle}>
                          {lesson?.title ?? item.title}
                        </Text>
                        <Text style={styles.bodyMuted}>
                          {lesson?.description ??
                            'Open the original course document.'}
                        </Text>
                        {lesson ? (
                          <Text style={styles.helperText}>
                            {lesson.estimatedMinutes} min ·{' '}
                            {lesson.sections.reduce(
                              (sum, value) => sum + value.questions.length,
                              0,
                            )}{' '}
                            questions{done ? ' · Completed' : ''}
                            {lesson &&
                            (book.lessons[lesson.slug]?.readingProgress ?? 0) >
                              0
                              ? ` · ${
                                  book.lessons[lesson.slug].readingProgress
                                }% read`
                              : ''}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.courseLessonArrow}>→</Text>
                    </Pressable>
                    {lesson && item.code !== 'intro' ? (
                      <StudyCompletionToggle
                        styles={styles}
                        checked={!!done}
                        disabled={!ready}
                        label={`Mark Study ${item.code} complete`}
                        onPress={() => update(lesson.slug, { complete: !done })}
                      />
                    ) : null}
                  </View>
                );
              })}
            </GlassCard>
          ))}
        </>
      ) : null}
      {courseSeries.length ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Published Bible Courses"
            subtitle="Read the courses available in your selected language."
          />
          {courseSeries.map(series => (
            <SeriesRowCard
              key={series.slug}
              styles={styles}
              title={series.title}
              description={series.description}
              meta={`${series.lessonCount} lessons`}
              onPress={() => onOpenSeries(series.slug)}
            />
          ))}
        </GlassCard>
      ) : language !== 'en' ? (
        <GlassCard styles={styles}>
          <Text style={styles.bodyMuted}>
            No Bible study courses are published in this language yet.
          </Text>
        </GlassCard>
      ) : null}
    </>
  );
}
