import { readingLanguageChoices } from '../src/design';
import { getStaticText } from '../src/i18n/staticText';
import {
  fetchRemoteLesson,
  fetchRemoteSeries,
  fetchRemoteSeriesCatalog,
  getRemoteApiLanguage,
  isRemoteReadingLanguage,
} from '../src/services/remoteContentService';

const russianSeries = {
  slug: 'beyond',
  title: 'Сверх ожиданий',
  description: 'Русский перевод книги Жака Секвейры.',
  language: 'ru',
  lessonCount: 19,
};

describe('Russian remote reading content', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes Russian as a supported remote reading language', () => {
    expect(readingLanguageChoices).toContainEqual({
      id: 'ru',
      label: 'Russian',
      nativeLabel: 'Русский',
    });
    expect(getRemoteApiLanguage('ru')).toBe('ru');
    expect(isRemoteReadingLanguage('ru')).toBe(true);
    expect(getStaticText('ru').navigation.library).toBe('Библиотека');
  });

  it('filters the shared catalog to Russian series', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        series: [
          russianSeries,
          { ...russianSeries, language: 'en', title: 'Beyond Belief' },
        ],
      }),
    } as Response);

    const catalog = await fetchRemoteSeriesCatalog('ru');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://jacksequeira.org/api/content/catalog',
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      slug: 'beyond',
      title: 'Сверх ожиданий',
      language: 'ru',
      lessonCount: 19,
      categoryLabel: 'Russian',
    });
  });

  it('loads Russian chapters and full lesson blocks through the native reader API', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          series: russianSeries,
          lessons: [
            {
              slug: 'beyond-item-1',
              title: 'Предисловие',
              excerpt: '',
              language: 'ru',
              order: 0,
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lesson: {
            slug: 'beyond-item-1',
            title: 'Предисловие',
            excerpt: '',
            language: 'ru',
            sourcePath: 'admin:beyond/beyond-item-1',
            blocks: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Русский текст урока.' }],
              },
            ],
          },
        }),
      } as Response);

    const series = await fetchRemoteSeries('beyond', 'ru');
    const lesson = await fetchRemoteLesson({
      lessonSlug: 'beyond-item-1',
      series,
      language: 'ru',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://jacksequeira.org/api/content/series/beyond?lang=ru',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://jacksequeira.org/api/content/lessons/beyond-item-1?lang=ru',
    );
    expect(series.lessons[0]).toMatchObject({
      title: 'Предисловие',
      language: 'ru',
    });
    expect(lesson.searchableText).toContain('Русский текст урока.');
    expect(lesson.sourcePath).toBe('admin:beyond/beyond-item-1');
  });
});
