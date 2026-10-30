import {
  mergePublishedCatalog,
  retainUnchangedLesson,
} from '../src/services/contentSync';
import {
  initialStudyRoomCourse,
  isStudyRoomCourse,
} from '../src/data/studyRoom';
import type { ArchiveLesson, ArchiveSeries } from '../src/data/archive';

const lesson = (slug: string, title = slug): ArchiveLesson => ({
  slug,
  title,
  seriesSlug: 'series',
  sequence: 0,
  keywords: [],
  blocks: [
    { type: 'paragraph', children: [{ type: 'text', value: 'Full text' }] },
  ],
  sourcePath: 'remote-full:series/' + slug,
  language: 'en',
  seriesTitle: 'Series',
  preview: 'Preview',
  searchableText: 'Full text',
  readingTimeMinutes: 1,
  readingTimeLabel: '1 min',
});
const series = (slug: string, lessons: ArchiveLesson[]): ArchiveSeries => ({
  slug,
  title: slug,
  category: 'topical',
  language: 'en',
  description: '',
  lessons,
  lessonSlugs: lessons.map(l => l.slug),
  lessonCount: lessons.length,
  categoryLabel: 'Studies',
  readingTimeMinutes: 1,
  readingTimeLabel: '1 min',
  shortTitle: slug,
});

test('published catalog includes new series and removes unpublished series and lessons', () => {
  const a = lesson('a'),
    b = lesson('b');
  const next = mergePublishedCatalog(
    [series('existing', [b]), series('new', [lesson('new')])],
    [series('existing', [a, b]), series('deleted', [a])],
  );
  expect(next.map(s => s.slug)).toEqual(['existing', 'new']);
  expect(next[0].lessons.map(l => l.slug)).toEqual(['b']);
  expect(
    mergePublishedCatalog(
      [series('existing', [])],
      [series('existing', [a])],
    )[0].lessons,
  ).toEqual([]);
});

test('new metadata takes precedence while a cached body remains available offline', () => {
  const cached = lesson('a');
  const summary = {
    ...lesson('a', 'New backend title'),
    blocks: [],
    sourcePath: 'remote-summary:series/a',
  };
  const merged = mergePublishedCatalog(
    [series('series', [summary])],
    [series('series', [cached])],
  );
  expect(merged[0].lessons[0].title).toBe('New backend title');
  expect(merged[0].lessons[0].blocks).toBe(cached.blocks);
});

test('unchanged background refresh preserves reader object and block references', () => {
  const cached = lesson('a');
  expect(
    retainUnchangedLesson(cached, JSON.parse(JSON.stringify(cached))),
  ).toBe(cached);
  expect(
    retainUnchangedLesson(cached, { ...lesson('a'), title: 'Changed title' })
      .blocks,
  ).toBe(cached.blocks);
});

test('course includes the introduction, four movements, all numbered studies and their real questions', () => {
  const course = initialStudyRoomCourse;
  expect(isStudyRoomCourse(course)).toBe(true);
  expect(course.parts).toHaveLength(4);
  expect(course.lessons[0].slug).toBe('introduction');
  expect(course.overview.title).toBe('Four movements, one gospel center');
  const core = course.lessons.filter(l => /^\d+$/.test(l.code));
  expect(core.map(l => Number(l.code))).toEqual(
    Array.from({ length: 25 }, (_, i) => i + 1),
  );
  expect(core.every(l => l.sections.some(s => s.questions.length > 0))).toBe(
    true,
  );
  expect(course.lessons.find(l => l.code === '5')?.sourceFile).toBe(
    'bstudy05.pdf',
  );
  expect(isStudyRoomCourse({ lessons: [] })).toBe(false);
});

test('featured content uses study series even when chapter summaries are not loaded', () => {
  const { selectFeaturedSeries } = require('../src/services/homeContent');
  const studies = {
    ...series('translated-studies', []),
    language: 'am',
    lessonCount: 19,
  };
  const course = { ...series('course', []), category: 'bible-study' };
  expect(
    selectFeaturedSeries([course, studies]).map(
      (item: ArchiveSeries) => item.slug,
    ),
  ).toEqual(['translated-studies']);
  expect(selectFeaturedSeries([course])).toEqual([course]);
});
