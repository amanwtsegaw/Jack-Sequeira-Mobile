import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  type InteractiveBibleStudy,
  type InteractiveStudyQuestion,
} from '../../data/interactiveBibleStudy';
import { type AppPalette } from '../../design';
import { type AppStyles } from '../styles';
import { GlassCard, InfoChip, SectionHeader } from './Shared';

export function InteractiveBibleStudy({
  study,
  styles,
  palette,
  responses,
  revealed,
  reflection,
  onChangeResponse,
  onToggleReveal,
  onChangeReflection,
  onOpenBibleReference,
}: {
  study: InteractiveBibleStudy;
  styles: AppStyles;
  palette: AppPalette;
  responses: Record<string, string>;
  revealed: string[];
  reflection: string;
  onChangeResponse: (questionId: string, value: string) => void;
  onToggleReveal: (questionId: string) => void;
  onChangeReflection: (value: string) => void;
  onOpenBibleReference: (reference: string) => void;
}) {
  const allQuestions = study.sections.flatMap(section => section.questions);
  const answeredCount = allQuestions.filter(
    item => responses[item.id]?.trim().length > 0,
  ).length;
  const completion = allQuestions.length
    ? Math.round((answeredCount / allQuestions.length) * 100)
    : 0;

  return (
    <>
      <GlassCard styles={styles}>
        <Text style={styles.eyebrow}>Interactive Bible Study</Text>
        <Text style={styles.sectionTitle}>{study.partLabel}</Text>
        <Text style={styles.bodyMuted}>
          Open each Scripture reference, write your response, and compare it
          with the original lesson guidance. The complete source is preserved
          below this guided study.
        </Text>
        <View style={styles.metaRow}>
          <InfoChip
            styles={styles}
            label={`${allQuestions.length} questions`}
          />
          <InfoChip styles={styles} label={`${answeredCount} answered`} />
          <InfoChip styles={styles} label={`${completion}% complete`} />
        </View>
        <View style={styles.studyProgressTrack}>
          <View
            style={[styles.studyProgressFill, { width: `${completion}%` }]}
          />
        </View>
        <View style={styles.studyStepsRow}>
          <StudyStep styles={styles} number="1" label="Read" />
          <View style={styles.studyStepConnector} />
          <StudyStep styles={styles} number="2" label="Respond" />
          <View style={styles.studyStepConnector} />
          <StudyStep styles={styles} number="3" label="Reflect" />
        </View>
        {study.introduction[0] ? (
          <View style={styles.studyIntroductionBox}>
            <Text style={styles.studyIntroductionLabel}>Lesson focus</Text>
            <Text style={styles.studyIntroductionText}>
              {study.introduction[0]}
            </Text>
          </View>
        ) : null}
      </GlassCard>

      {study.sections.map((section, sectionIndex) => {
        const sectionAnswered = section.questions.filter(
          item => responses[item.id]?.trim().length > 0,
        ).length;
        return (
          <GlassCard key={section.title} styles={styles}>
            <View style={styles.studyQuestionSectionHeader}>
              <View style={styles.studyQuestionSectionNumber}>
                <Text style={styles.studyQuestionSectionNumberText}>
                  {sectionIndex + 1}
                </Text>
              </View>
              <View style={styles.studyQuestionSectionHeading}>
                <Text style={styles.eyebrow}>Study section</Text>
                <Text style={styles.studyQuestionSectionTitle}>
                  {section.title}
                </Text>
              </View>
              <Text style={styles.studySectionProgress}>
                {sectionAnswered}/{section.questions.length}
              </Text>
            </View>
            <Text style={styles.bodyMuted}>{section.summary}</Text>
            <View style={styles.studyQuestionSection}>
              {section.questions.map(item => (
                <StudyQuestionCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  palette={palette}
                  value={responses[item.id] ?? ''}
                  revealed={revealed.includes(item.id)}
                  onChangeValue={value => onChangeResponse(item.id, value)}
                  onToggleReveal={() => onToggleReveal(item.id)}
                  onOpenBibleReference={() =>
                    onOpenBibleReference(item.reference)
                  }
                />
              ))}
            </View>
          </GlassCard>
        );
      })}

      <GlassCard styles={styles}>
        <SectionHeader
          styles={styles}
          title="Reflect and respond"
          subtitle={study.responsePrompt}
        />
        <TextInput
          multiline
          placeholder="Write what stands out, questions to revisit, or a prayerful response..."
          placeholderTextColor={palette.muted}
          value={reflection}
          onChangeText={onChangeReflection}
          style={styles.noteInput}
          textAlignVertical="top"
        />
        <Text style={styles.studySavedLabel}>Saved automatically</Text>
      </GlassCard>
    </>
  );
}

function StudyStep({
  styles,
  number,
  label,
}: {
  styles: AppStyles;
  number: string;
  label: string;
}) {
  return (
    <View style={styles.studyStep}>
      <View style={styles.studyStepNumber}>
        <Text style={styles.studyStepNumberText}>{number}</Text>
      </View>
      <Text style={styles.studyStepLabel}>{label}</Text>
    </View>
  );
}

function StudyQuestionCard({
  item,
  styles,
  palette,
  value,
  revealed,
  onChangeValue,
  onToggleReveal,
  onOpenBibleReference,
}: {
  item: InteractiveStudyQuestion;
  styles: AppStyles;
  palette: AppPalette;
  value: string;
  revealed: boolean;
  onChangeValue: (value: string) => void;
  onToggleReveal: () => void;
  onOpenBibleReference: () => void;
}) {
  const answered = value.trim().length > 0;

  return (
    <View
      style={[
        styles.studyQuestionCard,
        answered && styles.studyQuestionCardAnswered,
      ]}
    >
      <View style={styles.studyQuestionHeader}>
        <View style={styles.studyQuestionNumber}>
          <Text style={styles.studyQuestionNumberText}>{item.id}</Text>
        </View>
        <View style={styles.studyQuestionCopy}>
          <Text style={styles.studyQuestionText}>{item.question}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.reference}`}
            onPress={onOpenBibleReference}
            style={styles.studyReferenceButton}
          >
            <Text style={styles.studyReferenceText} numberOfLines={2}>
              Read {item.reference}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.studyResponseHeader}>
        <Text style={styles.studyResponseLabel}>Your response</Text>
        {answered ? (
          <Text style={styles.studyResponseSaved}>Saved ✓</Text>
        ) : null}
      </View>
      <TextInput
        multiline
        placeholder="Write what you see in the passage..."
        placeholderTextColor={palette.muted}
        value={value}
        onChangeText={onChangeValue}
        style={styles.studyResponseInput}
        textAlignVertical="top"
      />

      {item.guidance ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed }}
            onPress={onToggleReveal}
            style={styles.studyCompareButton}
          >
            <Text style={styles.studyCompareButtonText}>
              {revealed ? 'Hide lesson insight' : 'View lesson insight'}
            </Text>
          </Pressable>
          {revealed ? (
            <View style={styles.studyGuidanceBox}>
              <Text style={styles.studyGuidanceLabel}>
                Original lesson note
              </Text>
              <Text style={styles.studyGuidanceText}>{item.guidance}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.studyReadPrompt}>
          Read the passage and record your response.
        </Text>
      )}
    </View>
  );
}
