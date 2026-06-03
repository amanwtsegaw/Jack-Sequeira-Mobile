import {
  blocksToPlainText,
  type Catalog,
  type Lesson,
  type SeriesManifest,
} from '../content/schema';

const rawCatalog = require('./catalog.json') as Catalog;

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

const categoryMeta: Record<CategoryKey, {title: string; description: string}> = {
  topical: {
    title: 'Topical Studies',
    description: 'Doctrinal and thematic series that mirror the main website archive.',
  },
  paraphrase: {
    title: 'Paraphrase Studies',
    description: 'Long-form chapter studies and verse-by-verse reading tracks.',
  },
  'bible-study': {
    title: 'Bible Study Courses',
    description: 'Structured courses suitable for steady devotional or group study.',
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

for (const series of rawCatalog.series) {
  const lessons = rawCatalog.lessons
    .filter(lesson => lesson.seriesSlug === series.slug)
    .sort((left, right) => left.sequence - right.sequence)
    .map(lesson => {
      const searchableText = blocksToPlainText(lesson.blocks);
      const readingTimeMinutes = Math.max(
        1,
        Math.round(searchableText.split(/\s+/).filter(Boolean).length / 220),
      );

      const archiveLesson: ArchiveLesson = {
        ...lesson,
        seriesTitle: series.title,
        preview: lesson.description || searchableText.slice(0, 220).trim(),
        searchableText,
        readingTimeMinutes,
        readingTimeLabel: `${readingTimeMinutes} min read`,
      };

      lessonsBySlug.set(lesson.slug, archiveLesson);
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
      series.title.length > 24 ? `${series.title.slice(0, 24).trim()}…` : series.title,
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

export function getTopSeries() {
  return [...allSeries].sort((left, right) => right.lessonCount - left.lessonCount);
}

export function getAllLessons() {
  return [...allLessons];
}

export function getFeaturedSeries() {
  return getTopSeries()[0];
}

export function getSeriesBySlug(seriesSlug: string) {
  return seriesBySlug.get(seriesSlug) ?? null;
}

export function getLessonBySlug(lessonSlug: string) {
  return lessonsBySlug.get(lessonSlug) ?? null;
}

export function getAdjacentLessons(seriesSlug: string, lessonSlug: string) {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) {
    return {previous: null, next: null};
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

export function getLessonSearchResults(query: string): LessonSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return allLessons
    .map(lesson => {
      const haystackTitle = `${lesson.title} ${lesson.seriesTitle}`.toLowerCase();
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
