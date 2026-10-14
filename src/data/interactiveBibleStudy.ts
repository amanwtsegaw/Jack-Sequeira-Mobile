import {
  type Block,
  type Inline,
  type Lesson,
} from '../content/schema';
import { type ArchiveLesson } from './archive';

export type InteractiveStudyQuestion = {
  id: string;
  question: string;
  reference: string;
  guidance?: string;
};

export type InteractiveStudySection = {
  title: string;
  summary: string;
  questions: InteractiveStudyQuestion[];
};

export type InteractiveBibleStudy = {
  code: string;
  partLabel: string;
  introduction: string[];
  sections: InteractiveStudySection[];
  responsePrompt: string;
};

const specialStudySlugs = new Set([
  'bs-index',
  '2adams',
  'builtupontherock05',
  'bstudy21a',
]);

const specialQuestions: Record<string, InteractiveStudyQuestion[]> = {
  '2adams': [
    question('1', 'Why does Adam\'s history affect every person?', 'Genesis 5:1-2; Acts 17:26', 'Humanity shares one connected life and history in Adam.'),
    question('2', 'What did Adam pass to his descendants?', 'Romans 5:12, 18', 'Adam passed on a fallen life under sin, condemnation, and death.'),
    question('3', 'Why is the new birth necessary?', '1 Corinthians 15:50', 'Life inherited from Adam cannot inherit God\'s kingdom; we need life in Christ.'),
    question('4', 'How could Christ become humanity\'s representative?', 'Hebrews 2:14, 17', 'The Son truly shared our humanity and became the last Adam while remaining without sin.'),
    question('5', 'What does justification by faith bring?', 'Romans 5:1; Romans 8:1', 'It brings peace with God and freedom from condemnation in Christ.'),
  ],
  builtupontherock05: [
    question('1', 'What is the fundamental contrast in the great controversy?', '1 Corinthians 13:5; Isaiah 14:12-14', 'God\'s government rests on selfless love; Satan\'s kingdom rests on self-exaltation.'),
    question('2', 'How did the controversy become humanity\'s conflict?', 'Genesis 3; Romans 5:12', 'At the Fall, humanity accepted the principle of self and came under sin\'s rule.'),
    question('3', 'What did the cross accomplish in the conflict?', 'John 12:31-33', 'The cross exposed Satan\'s kingdom and revealed God\'s self-giving love.'),
    question('4', 'What new citizenship does faith in Christ bring?', 'John 5:24; Colossians 1:13', 'The believer passes from death to life and into Christ\'s kingdom.'),
    question('5', 'How will the controversy end?', 'Revelation 21:1-4', 'Sin, death, mourning, and pain will end when God restores creation.'),
  ],
};

export const preAdventSupplementLesson: Lesson = {
  slug: 'bstudy21a',
  seriesSlug: 'bstudy',
  sequence: 22,
  title: 'Supplement: Why a Pre-Advent Judgment?',
  description:
    'A guided study of why the judgment of believers precedes Christ\'s return and how Daniel\'s prophecies illuminate its timing.',
  sourcePath: 'jacksequeira.org/bstudy21a.pdf',
  language: 'en',
  blocks: [
    {
      type: 'heading',
      level: 2,
      children: [{ type: 'text', value: 'Why a Pre-Advent Judgment?' }],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value:
            'This supplement examines the timing of judgment in relation to Christ\'s return and follows the prophetic sequence through Daniel 2, 7, 8, and 9.',
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'heading',
      level: 3,
      children: [{ type: 'text', value: 'Study Questions' }],
    },
    {
      type: 'list',
      ordered: true,
      items: [
        studyItem(
          'What does Christ say He brings with Him when He comes?',
          'Revelation 22:12',
          'If the reward is brought at the Second Coming, the trial and verdict must already have taken place.',
        ),
        studyItem(
          'How does Jesus\' answer combine events separated in time?',
          'Matthew 24:1-3',
          'The discourse places Jerusalem\'s destruction and Christ\'s return in one prophetic view while the events remain distinct.',
        ),
        studyItem(
          'Which event in Daniel 2 parallels the concluding scenes in Daniel 7 and 8?',
          'Daniel 2; Daniel 7; Daniel 8',
          'Compare the stone cut out without human hands with the judgment and kingdom scenes in the later visions.',
        ),
        studyItem(
          'Why should Daniel 8 be studied together with Daniel 9?',
          'Daniel 8-9',
          'Daniel 9 returns to unfinished questions from the earlier vision and supplies information needed to understand its time period.',
        ),
        studyItem(
          'Which passages help explain the prophetic day-for-a-year principle?',
          'Numbers 14:34; Ezekiel 4:6',
          'These passages use a day symbolically for a year and help interpret the prophetic period.',
        ),
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value:
            'After reading the cited passages, write what is clearer to you about the purpose and timing of the pre-advent judgment.',
        },
      ],
    },
  ],
};

export function isInteractiveBibleStudyLesson(lesson: ArchiveLesson) {
  return (
    lesson.seriesSlug === 'bstudy' ||
    /^bstudy\d+[a-z]?$/.test(lesson.slug) ||
    specialStudySlugs.has(lesson.slug)
  );
}

export function buildInteractiveBibleStudy(
  lesson: ArchiveLesson,
): InteractiveBibleStudy | null {
  if (!isInteractiveBibleStudyLesson(lesson)) {
    return null;
  }

  const code = getStudyCode(lesson.slug);
  const parsedQuestions = getSourceQuestions(lesson.blocks);
  const questions =
    parsedQuestions.length > 0
      ? parsedQuestions
      : specialQuestions[lesson.slug] ?? [];

  if (lesson.slug === 'bs-index') {
    return {
      code: 'Intro',
      partLabel: 'Course introduction',
      introduction: getSourceIntroduction(lesson.blocks),
      sections: [],
      responsePrompt:
        'What do you most hope to understand or experience as you begin this course?',
    };
  }

  return {
    code,
    partLabel: getPartLabel(code),
    introduction: getSourceIntroduction(lesson.blocks),
    sections: chunkQuestions(questions),
    responsePrompt: `What truth from ${lesson.title} most clearly deepens your understanding of the gospel, and how will you respond?`,
  };
}

function getSourceIntroduction(blocks: Block[]) {
  const paragraphs: string[] = [];
  for (const block of blocks) {
    if (block.type === 'divider' || block.type === 'list') break;
    if (block.type !== 'paragraph') continue;
    const text = cleanText(inlineListText(block.children));
    if (text) paragraphs.push(text);
  }
  return paragraphs.slice(0, 3);
}

function getSourceQuestions(blocks: Block[]): InteractiveStudyQuestion[] {
  const list = blocks.find(block => block.type === 'list' && block.ordered);
  if (!list || list.type !== 'list') return [];

  return list.items
    .map((item, index) => parseQuestion(item, String(index + 1)))
    .filter((item): item is InteractiveStudyQuestion => Boolean(item));
}

function parseQuestion(
  inlines: Inline[],
  id: string,
): InteractiveStudyQuestion | null {
  const noteIndex = inlines.findIndex(
    inline =>
      inline.type === 'text' &&
      inline.marks?.includes('strong') &&
      /^note:?$/i.test(inline.value.trim()),
  );
  const promptInlines = noteIndex >= 0 ? inlines.slice(0, noteIndex) : inlines;
  const questionText = promptInlines
    .filter(
      inline =>
        inline.type === 'text' && inline.marks?.includes('strong'),
    )
    .map(inline => (inline.type === 'text' ? inline.value : ''))
    .join(' ');

  if (!cleanText(questionText)) return null;

  const reference = promptInlines
    .filter(
      inline =>
        !(inline.type === 'text' && inline.marks?.includes('strong')),
    )
    .map(inlineText)
    .join(' ')
    .replace(/_{2,}/g, ' ')
    .replace(/\([a-z]\)\s*(?=\([a-z]\)|$)/gi, ' ');
  const guidance =
    noteIndex >= 0
      ? cleanText(inlineListText(inlines.slice(noteIndex + 1)))
      : '';

  return question(
    id,
    cleanText(questionText),
    cleanText(reference) || 'Read the passage cited in the original lesson',
    guidance || undefined,
  );
}

function chunkQuestions(
  questions: InteractiveStudyQuestion[],
): InteractiveStudySection[] {
  const sections: InteractiveStudySection[] = [];
  const size = 7;
  for (let start = 0; start < questions.length; start += size) {
    const end = Math.min(start + size, questions.length);
    sections.push({
      title: `Questions ${start + 1}-${end}`,
      summary:
        start === 0
          ? 'Read the cited passage, write your response, then compare it with the original lesson guidance.'
          : 'Continue through the lesson in sequence and let Scripture lead your response.',
      questions: questions.slice(start, end),
    });
  }
  return sections;
}

function getStudyCode(slug: string) {
  if (slug === '2adams') return '3a';
  if (slug === 'builtupontherock05') return '5';
  const match = slug.match(/^bstudy0*(\d+)([a-z]?)$/);
  return match ? `${Number(match[1])}${match[2]}` : 'Study';
}

function getPartLabel(code: string) {
  const number = Number.parseInt(code, 10);
  if (number <= 5) return `Part 1 / Lesson ${code}`;
  if (number <= 12) return `Part 2 / Lesson ${code}`;
  if (number <= 19) return `Part 3 / Lesson ${code}`;
  return `Part 4 / Lesson ${code}`;
}

function question(
  id: string,
  prompt: string,
  reference: string,
  guidance?: string,
): InteractiveStudyQuestion {
  return { id, question: prompt, reference, guidance };
}

function studyItem(prompt: string, reference: string, guidance: string): Inline[] {
  return [
    { type: 'text', value: prompt, marks: ['strong'] },
    { type: 'text', value: ` ${reference} ` },
    { type: 'text', value: 'Note:', marks: ['strong'] },
    { type: 'text', value: ` ${guidance}` },
  ];
}

function inlineListText(inlines: Inline[]) {
  return inlines.map(inlineText).join('').replace(/\s+/g, ' ').trim();
}

function inlineText(inline: Inline): string {
  if (inline.type === 'text') return inline.value;
  if (inline.type === 'verseNumber') return inline.n;
  return inline.children.map(inlineText).join('');
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
