import { getLessonBySlug, getSeriesBySlug } from '../src/data/archive';
import { getBibleStudyCourse } from '../src/data/bibleStudyCourse';
import { buildInteractiveBibleStudy } from '../src/data/interactiveBibleStudy';

describe('interactive Bible study course', () => {
  it('keeps every listed course lesson inside the native reader', () => {
    const course = getBibleStudyCourse();
    const items = course.sections.flatMap(section => section.items);

    expect(items.length).toBeGreaterThan(25);
    expect(
      items
        .filter(item => !item.localLesson)
        .map(item => `${item.code}: ${item.localLessonSlug}`),
    ).toEqual([]);
  });

  it('builds guided questions from the original lesson source', () => {
    const lesson = getLessonBySlug('bstudy01');
    expect(lesson).not.toBeNull();

    const study = buildInteractiveBibleStudy(lesson!);
    const questions = study?.sections.flatMap(section => section.questions) ?? [];

    expect(study?.code).toBe('1');
    expect(questions.length).toBeGreaterThan(10);
    expect(questions[0]?.reference).toContain('Genesis');
  });

  it('includes the pre-advent judgment supplement in course order', () => {
    const series = getSeriesBySlug('bstudy');
    const supplementIndex = series?.lessonSlugs.indexOf('bstudy21a') ?? -1;

    expect(supplementIndex).toBeGreaterThan(-1);
    expect(series?.lessonSlugs[supplementIndex - 1]).toBe('bstudy21');
    expect(series?.lessonSlugs[supplementIndex + 1]).toBe('bstudy22');
    expect(buildInteractiveBibleStudy(getLessonBySlug('bstudy21a')!)).not.toBeNull();
  });
});
