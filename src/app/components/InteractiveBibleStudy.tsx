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
          <InfoChip styles={styles} label={`${allQuestions.length} questions`} />
          <InfoChip styles={styles} label={`${answeredCount} answered`} />
          <InfoChip styles={styles} label={`${completion}% complete`} />
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

      {study.sections.length > 0 ? (
        <GlassCard styles={styles}>
          <SectionHeader
            styles={styles}
            title="Questions and responses"
            subtitle="Your answers are saved automatically on this device."
          />
          {study.sections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.studyQuestionSection}>
              <Text style={styles.eyebrow}>Question set {sectionIndex + 1}</Text>
              <Text style={styles.studyQuestionSectionTitle}>
                {section.title}
              </Text>
              <Text style={styles.bodyMuted}>{section.summary}</Text>
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
          ))}
        </GlassCard>
      ) : null}

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
  return (
    <View style={styles.studyQuestionCard}>
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
          >
            <Text style={styles.studyReferenceText}>{item.reference}</Text>
          </Pressable>
        </View>
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
              {revealed ? 'Hide comparison' : 'Compare response'}
            </Text>
          </Pressable>
          {revealed ? (
            <View style={styles.studyGuidanceBox}>
              <Text style={styles.studyGuidanceLabel}>Original lesson note</Text>
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
