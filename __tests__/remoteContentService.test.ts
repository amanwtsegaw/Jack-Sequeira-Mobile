import {
  fetchRemoteSeriesCatalog,
  fetchRemoteMediaCatalog,
  getRemoteApiLanguage,
  isRemoteReadingLanguage,
} from '../src/services/remoteContentService';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test('Russian loads the real Russian backend catalog', async () => {
  const mock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      series: [
        {
          slug: 'beyond',
          title: 'Сверх ожиданий',
          language: 'ru',
          lessonCount: 19,
          lessons: [
            { slug: 'chapter-1', title: 'Глава 1', language: 'ru', order: 0 },
          ],
        },
      ],
    }),
  });
  globalThis.fetch = mock;
  expect(isRemoteReadingLanguage('ru')).toBe(true);
  expect(getRemoteApiLanguage('tm')).toBe('ti');
  const catalog = await fetchRemoteSeriesCatalog('ru');
  expect(mock.mock.calls[0][0]).toBe(
    'https://jacksequeira.org/api/content/catalog?lang=ru',
  );
  expect(catalog[0].language).toBe('ru');
  expect(catalog[0].lessons[0].title).toBe('Глава 1');
});
test('backend course placement is retained', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      series: [
        {
          slug: 'new-course',
          title: 'Course',
          language: 'en',
          destination: 'bible-study-courses',
        },
      ],
    }),
  });
  expect((await fetchRemoteSeriesCatalog('en'))[0].category).toBe(
    'bible-study',
  );
});
test('successful empty media replaces old content, but malformed responses are rejected', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ audioCollections: [], videoCollections: [] }),
  });
  expect((await fetchRemoteMediaCatalog()).audioCollections).toEqual([]);
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ error: 'bad data' }) });
  await expect(fetchRemoteMediaCatalog()).rejects.toThrow('Invalid media');
  await expect(fetchRemoteSeriesCatalog('en')).rejects.toThrow(
    'Invalid reading catalog',
  );
});

test('backend placement overrides a bundled course category', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        series: [
          {
            slug: 'bstudy',
            title: 'Moved study',
            language: 'en',
            destination: 'study-materials',
          },
        ],
      }),
    });
  expect((await fetchRemoteSeriesCatalog('en'))[0].category).toBe('topical');
});
