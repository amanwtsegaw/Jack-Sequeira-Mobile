import {
  blocksToPlainText,
  type Catalog,
  type Lesson,
  type SeriesManifest,
} from '../content/schema';
import { type ReadingLanguage } from '../design';
import bstudy01 from './series/bstudy/bstudy01.json';
import bstudy02 from './series/bstudy/bstudy02.json';
import bstudy03 from './series/bstudy/bstudy03.json';
import bstudy04 from './series/bstudy/bstudy04.json';
import bstudy05 from './series/bstudy/bstudy05.json';
import bstudy06 from './series/bstudy/bstudy06.json';
import bstudy07 from './series/bstudy/bstudy07.json';
import bstudy08 from './series/bstudy/bstudy08.json';
import bstudy09 from './series/bstudy/bstudy09.json';
import bstudy10 from './series/bstudy/bstudy10.json';
import bstudy11 from './series/bstudy/bstudy11.json';
import bstudy12 from './series/bstudy/bstudy12.json';
import bstudy13 from './series/bstudy/bstudy13.json';
import bstudy14 from './series/bstudy/bstudy14.json';
import bstudy15 from './series/bstudy/bstudy15.json';
import bstudy16 from './series/bstudy/bstudy16.json';
import bstudy17 from './series/bstudy/bstudy17.json';
import bstudy18 from './series/bstudy/bstudy18.json';
import bstudy19 from './series/bstudy/bstudy19.json';
import bstudy20 from './series/bstudy/bstudy20.json';
import bstudy21 from './series/bstudy/bstudy21.json';
import bstudy22 from './series/bstudy/bstudy22.json';
import bstudy23 from './series/bstudy/bstudy23.json';
import bstudy24 from './series/bstudy/bstudy24.json';
import bstudy25 from './series/bstudy/bstudy25.json';
import threeAngelsManifest from './series/3angels.json';
import beyondManifest from './series/beyond.json';
import bstudyManifest from './series/bstudy.json';
import builtUponTheRockManifest from './series/builtupontherock.json';
import churchManifest from './series/church.json';
import crossManifest from './series/cross.json';
import divhumfamManifest from './series/divhumfam.json';
import dyunitManifest from './series/dyunit.json';
import everlastManifest from './series/everlast.json';
import explainGospelManifest from './series/explaingospel.json';
import galatiansManifest from './series/galatians.json';
import hebrewManifest from './series/hebrew.json';
import holyspiritManifest from './series/holyspirit.json';
import issuesManifest from './series/issues.json';
import laodicManifest from './series/laodic.json';
import parablManifest from './series/parabl.json';
import romanManifest from './series/roman.json';
import romansManifest from './series/romans.json';
import sanctuaryManifest from './series/sanctuary.json';
import savemankindManifest from './series/savemankind.json';
import saviorManifest from './series/savior.json';
import sotmManifest from './series/sotm.json';
import ephesiansManifest from './series/ephesians.json';
import standaloneManifest from './series/standalone.json';
import understandGospelManifest from './series/understandgospel.json';

const rawCatalog = require('./catalog.json') as Catalog;
const localSeriesManifests = [
  threeAngelsManifest,
  beyondManifest,
  bstudyManifest,
  builtUponTheRockManifest,
  churchManifest,
  crossManifest,
  divhumfamManifest,
  dyunitManifest,
  everlastManifest,
  explainGospelManifest,
  galatiansManifest,
  hebrewManifest,
  holyspiritManifest,
  issuesManifest,
  laodicManifest,
  parablManifest,
  romanManifest,
  romansManifest,
  sanctuaryManifest,
  savemankindManifest,
  saviorManifest,
  sotmManifest,
  ephesiansManifest,
  standaloneManifest,
  understandGospelManifest,
] as SeriesManifest[];
const localSeriesManifestMap = new Map(
  localSeriesManifests.map(series => [series.slug, series] as const),
);
const catalogSeries = [
  ...rawCatalog.series.map(
    series => localSeriesManifestMap.get(series.slug) ?? series,
  ),
  ...localSeriesManifests.filter(
    series =>
      !rawCatalog.series.some(
        catalogSeriesItem => catalogSeriesItem.slug === series.slug,
      ),
  ),
];
const bstudyLessons = [
  bstudy01,
  bstudy02,
  bstudy03,
  bstudy04,
  bstudy05,
  bstudy06,
  bstudy07,
  bstudy08,
  bstudy09,
  bstudy10,
  bstudy11,
  bstudy12,
  bstudy13,
  bstudy14,
  bstudy15,
  bstudy16,
  bstudy17,
  bstudy18,
  bstudy19,
  bstudy20,
  bstudy21,
  bstudy22,
  bstudy23,
  bstudy24,
  bstudy25,
] as Lesson[];
const bstudyLessonMap = new Map(
  bstudyLessons.map(lesson => [lesson.slug, lesson] as const),
);
const catalogLessons = [
  ...rawCatalog.lessons.map(
    lesson => bstudyLessonMap.get(lesson.slug) ?? lesson,
  ),
  ...bstudyLessons.filter(
    lesson =>
      !rawCatalog.lessons.some(
        catalogLesson => catalogLesson.slug === lesson.slug,
      ),
  ),
];

type CategoryKey = SeriesManifest['category'];

export type ArchiveLesson = Lesson & {
  seriesTitle: string;
  preview: string;
  searchableText: string;
  readingTimeMinutes: number;
  readingTimeLabel: string;
};

export type ArchiveSeries = SeriesManifest & {
  lessons: ArchiveLesson[];
  lessonCount: number;
  categoryLabel: string;
  readingTimeMinutes: number;
  readingTimeLabel: string;
  shortTitle: string;
};

export type LessonSearchResult = {
  slug: string;
  seriesSlug: string;
  title: string;
  seriesTitle: string;
  snippet: string;
  matchLabel: string;
  score: number;
};

const categoryMeta: Record<
  CategoryKey,
  { title: string; description: string }
> = {
  topical: {
    title: 'Topical Studies',
    description:
      'Doctrinal and thematic series that mirror the main website archive.',
  },
  paraphrase: {
    title: 'Paraphrase Studies',
    description: 'Long-form chapter studies and verse-by-verse reading tracks.',
  },
  'bible-study': {
    title: 'Bible Study Courses',
    description:
      'Structured courses suitable for steady devotional or group study.',
  },
  sermon: {
    title: 'Sermon Manuscripts',
    description: 'Message-driven studies adapted for direct reading.',
  },
  standalone: {
    title: 'Standalone Pages',
    description: 'Single lessons and supporting archive material.',
  },
};

const lessonsBySlug = new Map<string, ArchiveLesson>();
const seriesBySlug = new Map<string, ArchiveSeries>();
const lessonsBySourceAndLanguage = new Map<string, ArchiveLesson>();

for (const series of catalogSeries) {
  const lessonOrder = new Map(
    series.lessonSlugs.map((lessonSlug, index) => [lessonSlug, index]),
  );
  const lessons = catalogLessons
    .filter(lesson => lessonOrder.has(lesson.slug))
    .sort((left, right) => {
      const leftOrder = lessonOrder.get(left.slug) ?? left.sequence;
      const rightOrder = lessonOrder.get(right.slug) ?? right.sequence;
      return leftOrder - rightOrder;
    })
    .map(lesson => {
      const searchableText = blocksToPlainText(lesson.blocks);
      const readingTimeMinutes = Math.max(
        1,
        Math.round(searchableText.split(/\s+/).filter(Boolean).length / 220),
      );

      const archiveLesson: ArchiveLesson = {
        ...lesson,
        seriesSlug: series.slug,
        seriesTitle: series.title,
        preview: lesson.description || searchableText.slice(0, 220).trim(),
        searchableText,
        readingTimeMinutes,
        readingTimeLabel: `${readingTimeMinutes} min read`,
      };

      lessonsBySlug.set(lesson.slug, archiveLesson);
      lessonsBySourceAndLanguage.set(
        buildLessonLanguageKey(lesson.sourcePath, lesson.language),
        archiveLesson,
      );
      return archiveLesson;
    });

  const readingTimeMinutes = lessons.reduce(
    (sum, lesson) => sum + lesson.readingTimeMinutes,
    0,
  );

  seriesBySlug.set(series.slug, {
    ...series,
    lessons,
    lessonCount: lessons.length,
    categoryLabel: categoryMeta[series.category].title,
    readingTimeMinutes,
    readingTimeLabel: `${readingTimeMinutes} min total`,
    shortTitle:
      series.title.length > 24
        ? `${series.title.slice(0, 24).trim()}…`
        : series.title,
  });
}

const allSeries = [...seriesBySlug.values()].sort((left, right) =>
  left.title.localeCompare(right.title),
);
const allLessons = [...lessonsBySlug.values()];

export const archiveStats = {
  seriesCount: allSeries.length,
  lessonCount: allLessons.length,
};

export function getTopSeries(language?: ReadingLanguage) {
  return [...allSeries]
    .filter(series => !language || series.language === language)
    .sort((left, right) => right.lessonCount - left.lessonCount);
}

export function getAllLessons() {
  return [...allLessons];
}

export function getFeaturedSeries(language?: ReadingLanguage) {
  return getTopSeries(language)[0] ?? getTopSeries('en')[0];
}

export function getFeaturedLessonsByCategory(language?: ReadingLanguage) {
  const lessons: ArchiveLesson[] = [];

  for (const category of Object.keys(categoryMeta) as CategoryKey[]) {
    const series = getTopSeries(language).find(
      item => item.category === category,
    );
    const fallbackSeries = getTopSeries('en').find(
      item => item.category === category,
    );
    const lesson = (series ?? fallbackSeries)?.lessons[0];

    if (lesson) {
      lessons.push(lesson);
    }
  }

  return lessons;
}

export function getSeriesBySlug(seriesSlug: string) {
  return seriesBySlug.get(seriesSlug) ?? null;
}

export function hasSeriesForLanguage(language: ReadingLanguage) {
  return allSeries.some(series => series.language === language);
}

export function getLessonBySlug(lessonSlug: string) {
  return lessonsBySlug.get(lessonSlug) ?? null;
}

export function getLessonForReadingLanguage(
  lesson: ArchiveLesson,
  language: ReadingLanguage,
) {
  return (
    lessonsBySourceAndLanguage.get(
      buildLessonLanguageKey(lesson.sourcePath, language),
    ) ?? lesson
  );
}

export function getAdjacentLessons(seriesSlug: string, lessonSlug: string) {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) {
    return { previous: null, next: null };
  }

  const index = series.lessons.findIndex(lesson => lesson.slug === lessonSlug);
  return {
    previous: index > 0 ? series.lessons[index - 1] : null,
    next:
      index >= 0 && index < series.lessons.length - 1
        ? series.lessons[index + 1]
        : null,
  };
}

export function getSeriesGroups() {
  return Object.entries(categoryMeta).map(([key, value]) => ({
    key: key as CategoryKey,
    title: value.title,
    description: value.description,
  }));
}

export function getRandomLesson() {
  const index = Math.floor(Math.random() * allLessons.length);
  return allLessons[index];
}

function buildLessonLanguageKey(sourcePath: string, language: string) {
  return `${sourcePath}::${language}`;
}

export function getLessonSearchResults(query: string): LessonSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return allLessons
    .map(lesson => {
      const haystackTitle =
        `${lesson.title} ${lesson.seriesTitle}`.toLowerCase();
      const haystackKeywords = lesson.keywords?.join(' ').toLowerCase() ?? '';
      const haystackBody = lesson.searchableText.toLowerCase();

      let score = 0;
      if (haystackTitle.includes(normalized)) {
        score += 4;
      }
      if (haystackKeywords.includes(normalized)) {
        score += 3;
      }
      if (haystackBody.includes(normalized)) {
        score += 2;
      }
      if (score === 0) {
        return null;
      }

      const bodyIndex = haystackBody.indexOf(normalized);
      const snippet =
        bodyIndex >= 0
          ? lesson.searchableText
              .slice(
                Math.max(0, bodyIndex - 72),
                Math.min(lesson.searchableText.length, bodyIndex + 170),
              )
              .trim()
          : lesson.preview;

      return {
        slug: lesson.slug,
        seriesSlug: lesson.seriesSlug,
        title: lesson.title,
        seriesTitle: lesson.seriesTitle,
        snippet,
        matchLabel: haystackTitle.includes(normalized)
          ? 'Title match'
          : haystackKeywords.includes(normalized)
          ? 'Keyword match'
          : 'Text match',
        score,
      } satisfies LessonSearchResult;
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right!.score !== left!.score) {
        return right!.score - left!.score;
      }
      return left!.title.localeCompare(right!.title);
    })
    .slice(0, 40) as LessonSearchResult[];
}
