import { type ReadingLanguage } from '../design';

export type BibleVersionId = 'kjv' | 'niv' | 'nlt' | 'rsv' | 'nasv';

export type BibleVersionOption = {
  id: BibleVersionId;
  label: string;
  name: string;
  language: Extract<ReadingLanguage, 'en' | 'am'>;
};

export type BibleVerseLine = {
  verse: number;
  text: string;
};

export type BibleVerseResult = {
  translationId: BibleVersionId;
  translationName: string;
  reference: string;
  verses: BibleVerseLine[];
  notice?: string;
};

export const bibleVersionOptions: BibleVersionOption[] = [
  { id: 'kjv', label: 'KJV', name: 'King James Version', language: 'en' },
  {
    id: 'niv',
    label: 'NIV',
    name: 'New International Version',
    language: 'en',
  },
  { id: 'nlt', label: 'NLT', name: 'New Living Translation', language: 'en' },
  { id: 'rsv', label: 'RSV', name: 'Revised Standard Version', language: 'en' },
  { id: 'nasv', label: 'NASV', name: 'Amharic NASV', language: 'am' },
];

const BIBLE_API_BASE_URL = 'https://bible-api.com';

type LocalBibleVersionId = Extract<
  BibleVersionId,
  'niv' | 'nlt' | 'rsv' | 'nasv'
>;
type LocalBibleChapter = Record<number, string>;
type LocalBibleBook = Record<number, LocalBibleChapter>;
type LocalBibleIndex = Record<number, LocalBibleBook>;

const localBibleIndexes = {
  niv: require('../bibles/generated/EnglishNIVBible.json') as LocalBibleIndex,
  nlt: require('../bibles/generated/EnglishNLTBible.json') as LocalBibleIndex,
  rsv: require('../bibles/generated/EnglishRSVBible.json') as LocalBibleIndex,
  nasv: require('../bibles/generated/AmharicNASVBible.json') as LocalBibleIndex,
} satisfies Record<LocalBibleVersionId, LocalBibleIndex>;

type BibleApiResponse = {
  reference?: string;
  text?: string;
  translation_id?: string;
  translation_name?: string;
  error?: string;
  verses?: Array<{
    verse?: number;
    text?: string;
  }>;
};

export async function fetchBibleReferenceVersion(
  reference: string,
  versionId: BibleVersionId,
): Promise<BibleVerseResult> {
  if (versionId !== 'kjv') {
    return fetchLocalBibleReference(reference, versionId);
  }

  const response = await fetch(
    `${BIBLE_API_BASE_URL}/${encodeURIComponent(reference)}?translation=kjv`,
  );
  const payload = (await response.json()) as BibleApiResponse;

  if (!response.ok || payload.error || !payload.text) {
    throw new Error(payload.error ?? 'Unable to load this Bible reference.');
  }

  return {
    translationId: 'kjv',
    translationName: payload.translation_name ?? 'King James Version',
    reference: payload.reference ?? reference,
    verses: normalizeBibleApiVerses(payload),
  };
}

async function fetchLocalBibleReference(
  reference: string,
  versionId: LocalBibleVersionId,
): Promise<BibleVerseResult> {
  const parsed = parseBibleReference(reference);
  const index = await loadLocalBibleIndex(versionId);
  const version = bibleVersionOptions.find(option => option.id === versionId);
  const chapter = index[parsed.bookNumber]?.[parsed.chapter];

  if (!chapter) {
    throw new Error(`Unable to find ${reference} in the local Bible file.`);
  }

  const verses: BibleVerseLine[] = [];
  for (let verse = parsed.startVerse; verse <= parsed.endVerse; verse += 1) {
    const text = chapter[verse];
    if (text) {
      verses.push({ verse, text });
    }
  }

  if (!verses.length) {
    throw new Error(`Unable to find ${reference} in the local Bible file.`);
  }

  return {
    translationId: versionId,
    translationName: version?.name ?? versionId.toUpperCase(),
    reference,
    verses,
  };
}

async function loadLocalBibleIndex(
  versionId: LocalBibleVersionId,
): Promise<LocalBibleIndex> {
  return localBibleIndexes[versionId];
}

function parseBibleReference(reference: string) {
  const normalizedReference = reference
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const match = normalizedReference.match(
    /^(.+?)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/,
  );

  if (!match) {
    throw new Error(`Unable to read Bible reference: ${reference}`);
  }

  const bookNumber = BOOK_ALIASES[normalizeBookName(match[1])];
  if (!bookNumber) {
    throw new Error(`Unable to find the Bible book in: ${reference}`);
  }

  const startVerse = Number(match[3]);
  const endVerse = match[4] ? Number(match[4]) : startVerse;

  return {
    bookNumber,
    chapter: Number(match[2]),
    startVerse,
    endVerse: Math.max(startVerse, endVerse),
  };
}

function normalizeBookName(value: string) {
  return value.toLowerCase().replace(/[.።፡]/g, '').replace(/\s+/g, ' ').trim();
}

const BOOK_ALIASES: Record<string, number> = {
  genesis: 1,
  gen: 1,
  exodus: 2,
  exod: 2,
  leviticus: 3,
  lev: 3,
  numbers: 4,
  num: 4,
  deuteronomy: 5,
  deut: 5,
  joshua: 6,
  josh: 6,
  judges: 7,
  judg: 7,
  ruth: 8,
  '1 samuel': 9,
  '1 sam': 9,
  '2 samuel': 10,
  '2 sam': 10,
  '1 kings': 11,
  '1 kgs': 11,
  '2 kings': 12,
  '2 kgs': 12,
  '1 chronicles': 13,
  '1 chron': 13,
  '1 chr': 13,
  '2 chronicles': 14,
  '2 chron': 14,
  '2 chr': 14,
  ezra: 15,
  nehemiah: 16,
  neh: 16,
  esther: 17,
  esth: 17,
  job: 18,
  psalms: 19,
  psalm: 19,
  ps: 19,
  proverbs: 20,
  prov: 20,
  ecclesiastes: 21,
  eccl: 21,
  'song of solomon': 22,
  'song of songs': 22,
  song: 22,
  isaiah: 23,
  isa: 23,
  jeremiah: 24,
  jer: 24,
  lamentations: 25,
  lam: 25,
  ezekiel: 26,
  ezek: 26,
  daniel: 27,
  dan: 27,
  hosea: 28,
  hos: 28,
  joel: 29,
  amos: 30,
  obadiah: 31,
  obad: 31,
  jonah: 32,
  micah: 33,
  mic: 33,
  nahum: 34,
  nah: 34,
  habakkuk: 35,
  hab: 35,
  zephaniah: 36,
  zeph: 36,
  haggai: 37,
  hag: 37,
  zechariah: 38,
  zech: 38,
  malachi: 39,
  mal: 39,
  matthew: 40,
  matt: 40,
  mark: 41,
  luke: 42,
  john: 43,
  acts: 44,
  romans: 45,
  rom: 45,
  '1 corinthians': 46,
  '1 cor': 46,
  '2 corinthians': 47,
  '2 cor': 47,
  galatians: 48,
  gal: 48,
  ephesians: 49,
  eph: 49,
  philippians: 50,
  phil: 50,
  colossians: 51,
  col: 51,
  '1 thessalonians': 52,
  '1 thess': 52,
  '2 thessalonians': 53,
  '2 thess': 53,
  '1 timothy': 54,
  '1 tim': 54,
  '2 timothy': 55,
  '2 tim': 55,
  titus: 56,
  philemon: 57,
  phlm: 57,
  hebrews: 58,
  heb: 58,
  james: 59,
  jas: 59,
  '1 peter': 60,
  '1 pet': 60,
  '2 peter': 61,
  '2 pet': 61,
  '1 john': 62,
  '2 john': 63,
  '3 john': 64,
  jude: 65,
  revelation: 66,
  rev: 66,
  ዘፍጥረት: 1,
  ዘፀአት: 2,
  ዘሌዋውያን: 3,
  ዘኍልቍ: 4,
  ዘዳግም: 5,
  ኢያሱ: 6,
  መሳፍንት: 7,
  ሩት: 8,
  ሳሙኤል: 9,
  '1 ሳሙኤል': 9,
  '2 ሳሙኤል': 10,
  ነገሥት: 11,
  '1 ነገሥት': 11,
  '2 ነገሥት': 12,
  'ዜና መዋዕል': 13,
  '1 ዜና መዋዕል': 13,
  '2 ዜና መዋዕል': 14,
  ዕዝራ: 15,
  ነህምያ: 16,
  አስቴር: 17,
  ኢዮብ: 18,
  መዝሙር: 19,
  ምሳሌ: 20,
  መክብብ: 21,
  መኃልየ: 22,
  ኢሳይያስ: 23,
  ኤርምያስ: 24,
  ሰቆቃወ: 25,
  ሕዝቅኤል: 26,
  ዳንኤል: 27,
  ሆሴዕ: 28,
  ኢዩኤል: 29,
  አሞጽ: 30,
  አብድዩ: 31,
  ዮናስ: 32,
  ሚክያስ: 33,
  ናሆም: 34,
  ዕንባቆም: 35,
  ሶፎንያስ: 36,
  ሐጌ: 37,
  ዘካርያስ: 38,
  ሚልክያስ: 39,
  ማቴዎስ: 40,
  ማርቆስ: 41,
  ሉቃስ: 42,
  ዮሐንስ: 43,
  ሐዋርያት: 44,
  ሮሜ: 45,
  ቆሮንቶስ: 46,
  '1 ቆሮንቶስ': 46,
  '2 ቆሮንቶስ': 47,
  ገላትያ: 48,
  ኤፌሶን: 49,
  ፊልጵስዩስ: 50,
  ቆላስይስ: 51,
  ተሰሎንቄ: 52,
  '1 ተሰሎንቄ': 52,
  '2 ተሰሎንቄ': 53,
  ጢሞቴዎስ: 54,
  '1 ጢሞቴዎስ': 54,
  '2 ጢሞቴዎስ': 55,
  ቲቶ: 56,
  ፊልሞና: 57,
  ዕብራውያን: 58,
  ያዕቆብ: 59,
  ጴጥሮስ: 60,
  '1 ጴጥሮስ': 60,
  '2 ጴጥሮስ': 61,
  '1 ዮሐንስ': 62,
  '2 ዮሐንስ': 63,
  '3 ዮሐንስ': 64,
  ይሁዳ: 65,
  ራእይ: 66,
};

function normalizeBibleApiVerses(payload: BibleApiResponse): BibleVerseLine[] {
  if (payload.verses?.length) {
    return payload.verses
      .filter(verse => typeof verse.text === 'string')
      .map((verse, index) => ({
        verse: verse.verse ?? index + 1,
        text: (verse.text ?? '').replace(/\s+/g, ' ').trim(),
      }));
  }

  return [
    {
      verse: extractFirstVerseNumber(payload.reference ?? '') ?? 1,
      text: (payload.text ?? '').replace(/\s+/g, ' ').trim(),
    },
  ];
}

function extractFirstVerseNumber(reference: string) {
  const match = reference.match(/:(\d+)/);
  return match ? Number(match[1]) : null;
}
