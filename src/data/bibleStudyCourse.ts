import { getLessonBySlug, type ArchiveLesson } from './archive';

const LEGACY_FILE_BASE =
  'https://jack-sequeira-web.vercel.app/api/legacy-file';

export type BibleStudyDocumentType = 'pdf' | 'html';

export type BibleStudyCourseItem = {
  code: string;
  title: string;
  routeSlug: string;
  fileName: string;
  type: BibleStudyDocumentType;
  localLessonSlug?: string;
  localSeriesSlug?: string;
};

export type ResolvedBibleStudyCourseItem = BibleStudyCourseItem & {
  localLesson: ArchiveLesson | null;
  documentUrl: string;
};

export type BibleStudyCourseSection = {
  title: string;
  items: ResolvedBibleStudyCourseItem[];
};

export type BibleStudyCourse = {
  title: string;
  scripture: string;
  sections: BibleStudyCourseSection[];
  totalResources: number;
  localReaderResources: number;
  fullCourse: BibleStudySupplement;
  printableHtml: BibleStudySupplement;
  whereNext: BibleStudySupplement;
};

export type BibleStudySupplement = {
  title: string;
  fileName: string;
  documentUrl: string;
};

const courseSections: Array<{
  title: string;
  items: BibleStudyCourseItem[];
}> = [
  {
    title: 'Introduction',
    items: [
      lesson('intro', 'Savior of the World Bible Study Index', 'bs_index.htm', {
        type: 'html',
        routeSlug: 'index',
        localLessonSlug: 'bs-index',
        localSeriesSlug: 'standalone',
      }),
    ],
  },
  {
    title: 'Part 1: The Incredible Good News of the Gospel',
    items: [
      lesson('1', 'Why You Need a Savior', 'bstudy01.pdf', {
        localLessonSlug: 'bstudy01',
      }),
      lesson('2', 'The Love of God', 'bstudy02.pdf', {
        routeSlug: 'the-love-of-god',
        localLessonSlug: 'bstudy02',
      }),
      lesson('3', 'The Truth As It Is In Christ', 'bstudy03.pdf', {
        routeSlug: 'the-truth-as-it-is-in-christ',
        localLessonSlug: 'bstudy03',
      }),
      lesson('3a', 'Supplement: The Two Adams', 'bstudy03a.pdf', {
        routeSlug: 'the-two-adams',
        localLessonSlug: '2adams',
        localSeriesSlug: 'standalone',
      }),
      lesson('4', 'The Supreme Sacrifice of Christ', 'bstudy04.pdf', {
        routeSlug: 'the-supreme-sacrifice-of-christ',
        localLessonSlug: 'bstudy04',
      }),
      lesson('5', 'The Great Controversy', 'builtupontherock05.htm', {
        type: 'html',
        routeSlug: 'the-great-controversy',
        localLessonSlug: 'builtupontherock05',
        localSeriesSlug: 'builtupontherock',
      }),
    ],
  },
  {
    title: 'Part 2: Experiencing the Power of the Gospel',
    items: [
      lesson('6', 'Justification by Faith', 'bstudy06.pdf', {
        localLessonSlug: 'bstudy06',
      }),
      lesson('7', 'Baptism Into Christ', 'bstudy07.pdf', {
        localLessonSlug: 'bstudy07',
      }),
      lesson('8', 'The New Birth', 'bstudy08.pdf', {
        localLessonSlug: 'bstudy08',
      }),
      lesson('9', 'Walking in the Spirit', 'bstudy09.pdf', {
        localLessonSlug: 'bstudy09',
      }),
      lesson('10', 'The Two Covenants', 'bstudy10.pdf', {
        localLessonSlug: 'bstudy10',
      }),
      lesson('11', 'Law and Grace', 'bstudy11.pdf', {
        localLessonSlug: 'bstudy11',
      }),
      lesson('12', 'The Blessed Hope', 'bstudy12.pdf', {
        localLessonSlug: 'bstudy12',
      }),
    ],
  },
  {
    title: 'Part 3: Biblical Doctrines in the Light of the Gospel',
    items: [
      lesson('13', 'The Godhead', 'bstudy13.pdf', {
        localLessonSlug: 'bstudy13',
      }),
      lesson('14', 'The Doctrine of Creation (with supplement)', 'bstudy14.pdf', {
        localLessonSlug: 'bstudy14',
      }),
      lesson('15', "Entering God's Rest", 'bstudy15.pdf', {
        localLessonSlug: 'bstudy15',
      }),
      lesson('16', 'Christian Stewardship', 'bstudy16.pdf', {
        localLessonSlug: 'bstudy16',
      }),
      lesson('17', 'The State of the Dead', 'bstudy17.pdf', {
        localLessonSlug: 'bstudy17',
      }),
      lesson('18', 'Spiritual Gifts', 'bstudy18.pdf', {
        localLessonSlug: 'bstudy18',
      }),
      lesson('19', 'Christian Lifestyle', 'bstudy19.pdf', {
        localLessonSlug: 'bstudy19',
      }),
    ],
  },
  {
    title: 'Part 4: Eschatology - Last Day Events',
    items: [
      lesson('20', 'The Sanctuary', 'bstudy20.pdf', {
        localLessonSlug: 'bstudy20',
      }),
      lesson('21', 'The Pre-Advent Judgment', 'bstudy21.pdf', {
        localLessonSlug: 'bstudy21',
      }),
      lesson('21a', 'Supplement: Why a Pre-Advent Judgment?', 'bstudy21a.pdf'),
      lesson('22', 'The Day of Atonement', 'bstudy22.pdf', {
        localLessonSlug: 'bstudy22',
      }),
      lesson('23', 'The Remnant and the 144,000', 'bstudy23.pdf', {
        localLessonSlug: 'bstudy23',
      }),
      lesson('24', 'The Millennium', 'bstudy24.pdf', {
        localLessonSlug: 'bstudy24',
      }),
      lesson('25', 'The New Earth', 'bstudy25.pdf', {
        localLessonSlug: 'bstudy25',
      }),
    ],
  },
];

export function getBibleStudyCourse(): BibleStudyCourse {
  const sections = courseSections.map(section => ({
    title: section.title,
    items: section.items.map(resolveCourseItem),
  }));
  const allItems = sections.flatMap(section => section.items);

  return {
    title: 'Savior of the World Bible Study',
    scripture:
      'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. - John 3:16 (NIV)',
    sections,
    totalResources: allItems.length,
    localReaderResources: allItems.filter(item => item.localLesson).length,
    fullCourse: supplement(
      'Entire Course (72 pages, 6.46 MB)',
      'bstudyall.pdf',
    ),
    printableHtml: supplement(
      'Original "God So Loved The World" Bible Study (HTML)',
      'bsindex2.htm',
    ),
    whereNext: supplement(
      'Where Do We Go From Here? (contains Scripture Index)',
      'bstudygo.pdf',
    ),
  };
}

export function getBibleStudyCourseLessons() {
  return getBibleStudyCourse()
    .sections.flatMap(section => section.items)
    .map(item => item.localLesson)
    .filter(Boolean) as ArchiveLesson[];
}

function resolveCourseItem(
  item: BibleStudyCourseItem,
): ResolvedBibleStudyCourseItem {
  const localLesson = item.localLessonSlug
    ? getLessonBySlug(item.localLessonSlug)
    : null;

  return {
    ...item,
    localLesson,
    localSeriesSlug:
      item.localSeriesSlug ?? localLesson?.seriesSlug ?? item.localSeriesSlug,
    documentUrl: legacyFileUrl(item.fileName),
  };
}

function lesson(
  code: string,
  title: string,
  fileName: string,
  options: {
    type?: BibleStudyDocumentType;
    routeSlug?: string;
    localLessonSlug?: string;
    localSeriesSlug?: string;
  } = {},
): BibleStudyCourseItem {
  return {
    code,
    title,
    fileName,
    type: options.type ?? 'pdf',
    routeSlug: options.routeSlug ?? slugify(title),
    localLessonSlug: options.localLessonSlug,
    localSeriesSlug: options.localSeriesSlug ?? 'bstudy',
  };
}

function supplement(title: string, fileName: string): BibleStudySupplement {
  return {
    title,
    fileName,
    documentUrl: legacyFileUrl(fileName),
  };
}

function legacyFileUrl(fileName: string) {
  return `${LEGACY_FILE_BASE}/${encodeURIComponent(fileName)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
