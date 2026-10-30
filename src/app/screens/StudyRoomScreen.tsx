import { AppTextInput as TextInput, AppText as Text } from '../../typography';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StudyCompletionToggle } from '../components/StudyCompletionToggle';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { BlockContent } from '../../components/BlockContent';
import {
  absoluteContentUrl,
  emptyStudyWork,
  type StudyRoomCourse,
  type StudyRoomLesson,
} from '../../data/studyRoom';
import { type AppPalette, resolveAppTypography } from '../../design';
import { useStudyWorkbook } from '../../hooks/useStudyWorkbook';
import {
  bibleVersionOptions,
  fetchBibleReferenceVersion,
  type BibleVersionId,
  type BibleVerseResult,
} from '../../services/bibleReferenceService';
import { type ReaderSettings } from '../../storage';
import { type AppStyles } from '../styles';
import {
  GlassCard,
  GlassHeader,
  PillButton,
  SectionHeader,
} from '../components/Shared';
import { BibleReferenceModal } from './LessonScreen';

function StudyRoomContent({
  course,
  lesson,
  styles,
  palette,
  settings,
  onBack,
  onOpenLesson,
}: {
  course: StudyRoomCourse;
  lesson: StudyRoomLesson;
  styles: AppStyles;
  palette: AppPalette;
  settings: ReaderSettings;
  onBack: () => void;
  onOpenLesson: (slug: string) => void;
}) {
  const { book, ready, update, activate, recordReading } = useStudyWorkbook();
  const work = book.lessons[lesson.slug] ?? emptyStudyWork;
  const [readingProgress, setReadingProgress] = useState(0);
  const [reference, setReference] = useState<string | null>(null);
  const [version, setVersion] = useState<BibleVersionId>('kjv');
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [verses, setVerses] = useState<BibleVerseResult[]>([]);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const scrollRatioRef = useRef(0);
  const gestureRef = useRef(false);
  const restoredRef = useRef(false);
  const measuredRef = useRef({ height: 0, viewport: 0 });
  const lastSavedBucketRef = useRef(-1);
  const restorePosition = useCallback(() => {
    const { height, viewport } = measuredRef.current;
    if (!ready || restoredRef.current || height <= 0 || viewport <= 0) return;
    restoredRef.current = true;
    scrollRatioRef.current = work.scrollRatio;
    setReadingProgress(work.readingProgress);
    if (work.scrollRatio > 0)
      scroll.current?.scrollTo({
        y: Math.max(0, height - viewport) * work.scrollRatio,
        animated: false,
      });
  }, [ready, work.scrollRatio, work.readingProgress]);
  function persistPosition() {
    if (gestureRef.current && ready)
      recordReading(lesson.slug, scrollRatioRef.current);
  }
  const positions = useRef<Record<string, number>>({});
  const index = course.lessons.findIndex(item => item.slug === lesson.slug);
  const questionCount = lesson.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0,
  );
  const textStyle = [
    styles.bodyMuted,
    {
      color: palette.foreground,
      fontSize: 17 * settings.fontScale,
      lineHeight: 17 * settings.fontScale * settings.lineHeight,
    },
  ];
  const inputStyle = [
    styles.noteInput,
    { color: palette.foreground, minHeight: 90 },
  ];
  const versionOptions = bibleVersionOptions.filter(
    item => item.language === 'en',
  );
  useEffect(() => {
    if (ready) activate(lesson.slug);
  }, [ready, lesson.slug, activate]);
  useEffect(() => {
    if (ready) {
      setReadingProgress(work.readingProgress);
      restorePosition();
    }
  }, [ready, restorePosition, work.readingProgress]);
  useEffect(() => {
    if (!reference) return;
    let active = true;
    setVerseLoading(true);
    setVerseError(null);
    setVerses([]);
    fetchBibleReferenceVersion(reference, version)
      .then(result => {
        if (active) setVerses([result]);
      })
      .catch(() => {
        if (active)
          setVerseError(
            'Unable to load this passage. Check your connection or choose another translation.',
          );
      })
      .finally(() => {
        if (active) setVerseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reference, version]);
  function referenceLink(value: string) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Read ${value}`}
        onPress={() => setReference(value)}
        style={{ paddingVertical: 8 }}
      >
        <Text style={styles.studyReferenceLink}>{value}</Text>
      </Pressable>
    );
  }
  function jump(id: string) {
    scroll.current?.scrollTo({
      y: Math.max(0, positions.current[id] ?? 0),
      animated: true,
    });
  }
  const toc = [
    ...(lesson.sourceType === 'overview'
      ? [{ id: 'course-path', title: 'Course path' }]
      : []),
    ...(lesson.sourceIntroduction?.length
      ? [{ id: 'introduction', title: 'Introduction' }]
      : []),
    ...(lesson.sections.length || lesson.articleBlocks?.length
      ? [{ id: 'study', title: 'Read the study' }]
      : []),
    ...(lesson.sections.length
      ? [{ id: 'questions', title: 'Questions and answers' }]
      : []),
    { id: 'reflection', title: 'Personal reflection' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 8,
          backgroundColor: palette.background,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.helperText}>Study progress</Text>
          <Text style={styles.helperText}>{readingProgress}% read</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: readingProgress }}
          style={{
            height: 4,
            backgroundColor: palette.outline,
            marginTop: 6,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 4,
              width: `${readingProgress}%`,
              backgroundColor: palette.primarySolid,
            }}
          />
        </View>
      </View>
      <ScrollView
        ref={scroll}
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={32}
        onLayout={event => {
          measuredRef.current.viewport = event.nativeEvent.layout.height;
          restorePosition();
        }}
        onContentSizeChange={(_width, height) => {
          measuredRef.current.height = height;
          restorePosition();
        }}
        onScrollBeginDrag={() => {
          gestureRef.current = true;
        }}
        onScrollEndDrag={persistPosition}
        onMomentumScrollEnd={persistPosition}
        onScroll={event => {
          const { contentOffset, contentSize, layoutMeasurement } =
            event.nativeEvent;
          const max = contentSize.height - layoutMeasurement.height;
          const next =
            max <= 0
              ? 100
              : Math.round(
                  Math.max(0, Math.min(1, contentOffset.y / max)) * 100,
                );
          const ratio =
            max <= 0 ? 1 : Math.max(0, Math.min(1, contentOffset.y / max));
          scrollRatioRef.current = ratio;
          setReadingProgress(current => Math.max(current, next));
          const bucket = Math.floor(next / 5);
          if (
            gestureRef.current &&
            ready &&
            bucket !== lastSavedBucketRef.current
          ) {
            lastSavedBucketRef.current = bucket;
            recordReading(lesson.slug, ratio);
          }
        }}
      >
        <GlassHeader
          styles={styles}
          title={
            lesson.code === 'intro' ? 'Introduction' : `Study ${lesson.code}`
          }
          leftAction={{
            icon: '‹',
            label: 'All Bible studies',
            onPress: onBack,
          }}
        />
        <GlassCard styles={styles}>
          <Text style={styles.eyebrow}>{lesson.eyebrow}</Text>
          <Text style={styles.screenTitle}>{lesson.title}</Text>
          <Text style={textStyle}>{lesson.description}</Text>
          <Text style={styles.cardMeta}>
            {lesson.estimatedMinutes} min study · {questionCount} guided
            questions
          </Text>
          <Text style={styles.eyebrow}>Begin with Scripture</Text>
          {referenceLink(lesson.keyVerseReference)}
          <Text style={textStyle}>{lesson.keyVerse}</Text>
        </GlassCard>
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="What you will explore"
            subtitle="Begin here"
          />
          {lesson.objectives.map((objective, i) => (
            <Text key={objective} style={textStyle}>
              {i + 1}. {objective}
            </Text>
          ))}
          <StudyCompletionToggle
            styles={styles}
            checked={work.complete}
            disabled={!ready}
            label="Mark study complete"
            onPress={() => update(lesson.slug, { complete: !work.complete })}
          />
          {lesson.sourceType === 'pdf' ? (
            <PillButton
              styles={styles}
              label="View Original PDF"
              onPress={() => {
                void Linking.openURL(
                  absoluteContentUrl(
                    `/bible-study-courses/pdf/${encodeURIComponent(
                      lesson.sourceFile,
                    )}`,
                  ),
                ).catch(() => undefined);
              }}
            />
          ) : null}
        </GlassCard>
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="On this page"
            subtitle="Jump to a section"
          />
          {toc.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => jump(item.id)}
              style={{ paddingVertical: 10 }}
            >
              <Text style={styles.helperText}>{item.title} ↓</Text>
            </Pressable>
          ))}
        </GlassCard>
        {lesson.sourceIntroduction?.length ? (
          <View
            onLayout={e => {
              positions.current.introduction = e.nativeEvent.layout.y;
            }}
          >
            <GlassCard styles={styles}>
              <SectionHeader
                styles={styles}
                title="Prepare for the study"
                subtitle="Original Study Introduction"
              />
              {lesson.sourceIntroduction.map((paragraph, i) => (
                <Text key={i} style={textStyle}>
                  {paragraph}
                </Text>
              ))}
            </GlassCard>
          </View>
        ) : null}
        {lesson.sourceType === 'overview' ? (
          <View
            onLayout={e => {
              positions.current['course-path'] = e.nativeEvent.layout.y;
            }}
          >
            <GlassCard styles={styles}>
              <SectionHeader
                styles={styles}
                title={course.overview.title}
                subtitle="Course path"
              />
              <Text style={textStyle}>{course.overview.description}</Text>
              {course.parts.map(part => (
                <View key={part.number} style={styles.courseLessonCard}>
                  <View style={styles.courseLessonCode}>
                    <Text style={styles.courseLessonCodeText}>
                      {part.number}
                    </Text>
                  </View>
                  <View style={styles.listCardBody}>
                    <Text style={styles.courseLessonTitle}>{part.title}</Text>
                    <Text style={styles.bodyMuted}>{part.lessons}</Text>
                  </View>
                </View>
              ))}
              <Text style={textStyle}>{course.overview.guidance}</Text>
            </GlassCard>
          </View>
        ) : null}
        {lesson.sections.length || lesson.articleBlocks?.length ? (
          <View
            onLayout={e => {
              positions.current.study = e.nativeEvent.layout.y;
            }}
          >
            <GlassCard styles={styles}>
              <SectionHeader
                styles={styles}
                title={
                  lesson.articleBlocks?.length
                    ? 'Complete original reading'
                    : 'Study the teaching'
                }
                subtitle="Step 1 / Read the study"
              />
              <Text style={textStyle}>
                Read the original study material and cited passages first. The
                question-and-answer section follows immediately afterward.
              </Text>
              {lesson.articleBlocks?.length ? (
                <BlockContent
                  blocks={lesson.articleBlocks}
                  settings={settings}
                  lessonSlug={`course:${lesson.slug}`}
                  highlights={[]}
                  palette={palette}
                  typography={resolveAppTypography(settings.fontChoice, 'en')}
                  onSelectText={() => undefined}
                  onOpenLink={url => {
                    void Linking.openURL(url).catch(() => undefined);
                  }}
                  onOpenBibleReference={setReference}
                />
              ) : (
                lesson.sections.map(section => (
                  <View key={section.title} style={{ gap: 12, marginTop: 20 }}>
                    <Text style={styles.cardTitle}>{section.title}</Text>
                    <Text style={textStyle}>{section.summary}</Text>
                    {section.questions.map((q, i) => (
                      <View key={i}>
                        <Text style={textStyle}>{q.question}</Text>
                        {referenceLink(q.reference)}
                      </View>
                    ))}
                  </View>
                ))
              )}
              {lesson.sourceConclusion?.map((block, i) => (
                <Text
                  key={i}
                  style={
                    block.type === 'heading' ? styles.cardTitle : textStyle
                  }
                >
                  {block.text}
                </Text>
              ))}
            </GlassCard>
          </View>
        ) : null}
        {lesson.sections.length ? (
          <View
            onLayout={e => {
              positions.current.questions = e.nativeEvent.layout.y;
            }}
          >
            <GlassCard styles={styles}>
              <SectionHeader
                styles={styles}
                title="Respond to the study"
                subtitle="Step 2 / Questions and answers"
              />
              <Text style={textStyle}>
                Open each cited Bible passage, write your response, then compare
                it with the original study answer or source note.
              </Text>
              {lesson.sections.map((section, sectionIndex) => (
                <View key={section.title} style={{ gap: 16, marginTop: 20 }}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  {section.questions.map((q, questionIndex) => {
                    const id = `${sectionIndex}-${questionIndex}`,
                      revealed = work.revealed.includes(id),
                      comparison = q.guidance ?? q.answer;
                    const number =
                      lesson.sections
                        .slice(0, sectionIndex)
                        .reduce((sum, item) => sum + item.questions.length, 0) +
                      questionIndex +
                      1;
                    return (
                      <View
                        key={id}
                        style={{
                          padding: 16,
                          gap: 10,
                          borderWidth: 1,
                          borderColor: palette.outlineVariant,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={textStyle}>
                          {number}. {q.question}
                        </Text>
                        {referenceLink(q.reference)}
                        <Text style={styles.cardMeta}>My response</Text>
                        <TextInput
                          accessibilityLabel={`Response to question ${number}`}
                          editable={ready}
                          value={work.responses[id] ?? ''}
                          multiline
                          textAlignVertical="top"
                          placeholder="Write what you see in the passage..."
                          placeholderTextColor={palette.muted}
                          style={inputStyle}
                          onChangeText={value =>
                            update(lesson.slug, {
                              responses: { ...work.responses, [id]: value },
                            })
                          }
                        />
                        {comparison ? (
                          <PillButton
                            styles={styles}
                            disabled={!ready}
                            label={
                              revealed ? 'Hide comparison' : 'Compare response'
                            }
                            onPress={() =>
                              update(lesson.slug, {
                                revealed: revealed
                                  ? work.revealed.filter(item => item !== id)
                                  : [...work.revealed, id],
                              })
                            }
                          />
                        ) : null}
                        {revealed && comparison ? (
                          <View
                            style={{
                              padding: 14,
                              borderLeftWidth: 3,
                              borderLeftColor: palette.primarySolid,
                              backgroundColor: palette.surfaceLow,
                            }}
                          >
                            <Text style={styles.eyebrow}>
                              {q.guidance
                                ? 'Original study note'
                                : 'Study answer'}
                            </Text>
                            <Text style={textStyle}>{comparison}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </GlassCard>
          </View>
        ) : null}
        <View
          onLayout={e => {
            positions.current.reflection = e.nativeEvent.layout.y;
          }}
        >
          <GlassCard styles={styles}>
            <SectionHeader
              styles={styles}
              title="Reflect and respond"
              subtitle="Step 3 / Personal reflection"
            />
            <Text style={textStyle}>{lesson.responsePrompt}</Text>
            <Text style={styles.cardMeta}>Private study notes</Text>
            <TextInput
              accessibilityLabel="Private study notes"
              editable={ready}
              value={work.notes}
              multiline
              textAlignVertical="top"
              style={[...inputStyle, { minHeight: 180 }]}
              placeholder="Write what stands out, questions to revisit, or a prayerful response..."
              placeholderTextColor={palette.muted}
              onChangeText={notes => update(lesson.slug, { notes })}
            />
            <Text style={styles.helperText}>
              Saved automatically on this device.
            </Text>
          </GlassCard>
        </View>
        <View style={{ gap: 12 }}>
          {index > 0 ? (
            <PillButton
              styles={styles}
              label={`← ${course.lessons[index - 1].title}`}
              onPress={() => onOpenLesson(course.lessons[index - 1].slug)}
            />
          ) : null}
          {index >= 0 && index < course.lessons.length - 1 ? (
            <PillButton
              styles={styles}
              label={`${course.lessons[index + 1].title} →`}
              onPress={() => onOpenLesson(course.lessons[index + 1].slug)}
            />
          ) : null}
          <PillButton
            styles={styles}
            label="All Bible studies"
            onPress={onBack}
          />
        </View>
      </ScrollView>
      <BibleReferenceModal
        visible={!!reference}
        styles={styles}
        palette={palette}
        reference={reference}
        loading={verseLoading}
        error={verseError}
        results={verses}
        selectedVersion={version}
        versionOptions={versionOptions}
        versionMenuOpen={versionsOpen}
        onToggleVersionMenu={() => setVersionsOpen(value => !value)}
        onSelectVersion={value => {
          setVersion(value);
          setVersionsOpen(false);
        }}
        onClose={() => {
          setReference(null);
          setVersionsOpen(false);
        }}
      />
    </View>
  );
}

export function StudyRoomScreen(
  props: React.ComponentProps<typeof StudyRoomContent>,
) {
  const [prepared, setPrepared] = useState(false);
  useEffect(() => {
    let second: number | undefined;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setPrepared(true));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second !== undefined) cancelAnimationFrame(second);
    };
  }, []);
  return prepared ? (
    <StudyRoomContent {...props} />
  ) : (
    <LoadingSkeleton
      palette={props.palette}
      variant="reader"
      label="Loading Bible study"
    />
  );
}
