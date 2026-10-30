import { isStudyRoomCourse, type StudyRoomCourse } from '../data/studyRoom';
import { getSeriesBySlug } from '../data/archive';
import { blocksToPlainText, type Block } from '../content/schema';
import { getReadingLanguageLabel, type ReadingLanguage } from '../design';
import { type ArchiveLesson, type ArchiveSeries } from '../data/archive';
import { type AudioCollection, type VideoCollection } from '../data/media';
import { CONTENT_API_BASE } from '../config';

type RemoteSeriesSummary = {
  slug: string;
  title: string;
  description?: string | null;
  language: string;
  lessonCount?: number;
  destination?: string;
  section?: string;
  lessons?: RemoteSeriesLesson[];
};

type RemoteSeriesLesson = {
  slug: string;
  title: string;
  excerpt?: string | null;
  language: string;
  order: number;
};

type RemoteLesson = {
  slug: string;
  title: string;
  excerpt?: string | null;
  language: string;
  blocks?: Block[] | null;
  sourcePath?: string | null;
};

export function getRemoteApiLanguage(language: ReadingLanguage) {
  return language === 'tm' ? 'ti' : language;
}

export function isRemoteReadingLanguage(language: ReadingLanguage) {
  return ['en', 'am', 'om', 'tm', 'ru'].includes(language);
}

export async function fetchRemoteMediaCatalog(): Promise<{
  audioCollections: AudioCollection[];
  videoCollections: VideoCollection[];
  generatedAt: string;
}> {
  const response = await fetchContent(`${CONTENT_API_BASE}/media`);
  if (!response.ok) {
    throw new Error('Unable to load the remote media catalog.');
  }

  const payload = (await response.json()) as {
    generatedAt?: string;
    audioCollections?: AudioCollection[];
    videoCollections?: VideoCollection[];
  };

  if (
    !Array.isArray(payload.audioCollections) ||
    !Array.isArray(payload.videoCollections)
  )
    throw new Error('Invalid media response.');

  return {
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
    audioCollections: (payload.audioCollections ?? []).map(collection => ({
      ...collection,
      tracks: collection.tracks.map(track => ({
        ...track,
        sourcePath:
          track.sourcePath ?? `remote:audio/${track.id ?? track.fileName}`,
      })),
    })),
    videoCollections: payload.videoCollections ?? [],
  };
}

export async function fetchRemoteSeriesCatalog(language: ReadingLanguage) {
  const apiLanguage = getRemoteApiLanguage(language);
  const response = await fetchContent(
    `${CONTENT_API_BASE}/catalog?lang=${encodeURIComponent(apiLanguage)}`,
  );
  if (!response.ok) {
    throw new Error('Unable to load remote reading catalog.');
  }

  const payload = (await response.json()) as {
    series?: RemoteSeriesSummary[];
  };

  if (!Array.isArray(payload.series))
    throw new Error('Invalid reading catalog.');

  return payload.series
    .filter(item => item.language === apiLanguage)
    .map(item =>
      buildRemoteSeries(
        item,
        (item.lessons ?? []).map(lesson =>
          buildRemoteLesson({ lesson, series: item, fullBlocks: null }),
        ),
      ),
    );
}

export async function fetchRemoteSeries(
  seriesSlug: string,
  language: ReadingLanguage,
) {
  const apiLanguage = getRemoteApiLanguage(language);
  const response = await fetchContent(
    `${CONTENT_API_BASE}/series/${encodeURIComponent(
      seriesSlug,
    )}?lang=${encodeURIComponent(apiLanguage)}`,
  );
  if (!response.ok) {
    throw new Error('Unable to load remote reading series.');
  }

  const payload = (await response.json()) as {
    series?: RemoteSeriesSummary;
    lessons?: RemoteSeriesLesson[];
  };
  if (!payload.series) {
    throw new Error('Remote reading series was empty.');
  }

  const lessons = (payload.lessons ?? []).map(lesson =>
    buildRemoteLesson({
      lesson,
      series: payload.series!,
      fullBlocks: null,
    }),
  );

  return buildRemoteSeries(payload.series, lessons);
}

export async function fetchRemoteLesson({
  lessonSlug,
  series,
  language,
}: {
  lessonSlug: string;
  series: ArchiveSeries;
  language: ReadingLanguage;
}) {
  const apiLanguage = getRemoteApiLanguage(language);
  const response = await fetchContent(
    `${CONTENT_API_BASE}/lessons/${encodeURIComponent(
      lessonSlug,
    )}?lang=${encodeURIComponent(apiLanguage)}`,
  );
  if (!response.ok) {
    throw new Error('Unable to load remote reading lesson.');
  }

  const payload = (await response.json()) as { lesson?: RemoteLesson };
  if (!payload.lesson) {
    throw new Error('Remote reading lesson was empty.');
  }

  return buildRemoteLesson({
    lesson: {
      slug: payload.lesson.slug,
      title: payload.lesson.title,
      excerpt: payload.lesson.excerpt,
      language: payload.lesson.language,
      order: resolveRemoteLessonOrder(payload.lesson.slug, series),
    },
    series,
    fullBlocks: payload.lesson.blocks ?? null,
    sourcePath: payload.lesson.sourcePath ?? null,
  });
}

function buildRemoteSeries(
  series: RemoteSeriesSummary,
  lessons: ArchiveLesson[],
): ArchiveSeries {
  const readingTimeMinutes =
    lessons.length > 0
      ? lessons.reduce((sum, lesson) => sum + lesson.readingTimeMinutes, 0)
      : Math.max(1, (series.lessonCount ?? 1) * 5);

  const localCategory = getSeriesBySlug(series.slug)?.category ?? 'topical';
  const isCourse = series.destination
    ? series.destination === 'bible-study-courses'
    : localCategory === 'bible-study';
  return {
    slug: series.slug,
    title: series.title,
    description:
      series.description ??
      `${getReadingLanguageLabelFromApi(series.language)} reading series`,
    category: isCourse
      ? 'bible-study'
      : localCategory === 'bible-study'
      ? 'topical'
      : localCategory,
    language: series.language,
    lessonSlugs: lessons.map(lesson => lesson.slug),
    lessons,
    lessonCount: series.lessonCount ?? lessons.length,
    categoryLabel:
      series.section || getReadingLanguageLabelFromApi(series.language),
    readingTimeMinutes,
    readingTimeLabel: `${readingTimeMinutes} min total`,
    shortTitle:
      series.title.length > 24
        ? `${series.title.slice(0, 24).trim()}...`
        : series.title,
  };
}

function buildRemoteLesson({
  lesson,
  series,
  fullBlocks,
  sourcePath,
}: {
  lesson: RemoteSeriesLesson;
  series: RemoteSeriesSummary | ArchiveSeries;
  fullBlocks: Block[] | null;
  sourcePath?: string | null;
}): ArchiveLesson {
  const hasFullBlocks = Boolean(fullBlocks && fullBlocks.length > 0);
  const blocks = hasFullBlocks
    ? fullBlocks!
    : buildPlaceholderBlocks(lesson.excerpt);
  const searchableText = blocksToPlainText(blocks);
  const readingTimeMinutes = Math.max(
    1,
    Math.round(searchableText.split(/\s+/).filter(Boolean).length / 220),
  );

  return {
    slug: lesson.slug,
    seriesSlug: series.slug,
    sequence: lesson.order,
    title: lesson.title,
    description: lesson.excerpt ?? undefined,
    keywords: [],
    blocks,
    sourcePath:
      sourcePath ??
      `${hasFullBlocks ? 'remote-full' : 'remote-summary'}:${series.slug}/${
        lesson.slug
      }`,
    language: lesson.language,
    seriesTitle: series.title,
    preview:
      lesson.excerpt || searchableText.slice(0, 220).trim() || lesson.title,
    searchableText,
    readingTimeMinutes,
    readingTimeLabel: `${readingTimeMinutes} min read`,
  };
}

function buildPlaceholderBlocks(excerpt?: string | null): Block[] {
  if (!excerpt) {
    return [];
  }

  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', value: excerpt }],
    },
  ];
}

function resolveRemoteLessonOrder(lessonSlug: string, series: ArchiveSeries) {
  const index = series.lessons.findIndex(lesson => lesson.slug === lessonSlug);
  return index >= 0 ? index + 1 : 1;
}

function getReadingLanguageLabelFromApi(language: string) {
  if (language === 'ti') {
    return getReadingLanguageLabel('tm');
  }

  if (
    language === 'am' ||
    language === 'om' ||
    language === 'en' ||
    language === 'ru'
  ) {
    return getReadingLanguageLabel(language);
  }

  return 'Reading';
}

export async function fetchRemoteBibleStudyCourse(): Promise<StudyRoomCourse> {
  const response = await fetchContent(`${CONTENT_API_BASE}/bible-study`);
  if (!response.ok) throw new Error('Unable to load Bible study courses.');
  const payload: unknown = await response.json();
  if (!isStudyRoomCourse(payload))
    throw new Error('Invalid Bible study course response.');
  return payload;
}

async function fetchContent(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
  } finally {
    clearTimeout(timeout);
  }
}
