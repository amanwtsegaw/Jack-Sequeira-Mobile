import type { Block } from '../content/schema';
import { SITE_ORIGIN } from '../config';
import bundledCourse from './bibleStudyRooms.json';

export type StudyQuestion = {
  question: string;
  reference: string;
  answer?: string;
  guidance?: string;
};
export type StudyRoomLesson = {
  slug: string;
  code: string;
  title: string;
  eyebrow: string;
  partLabel?: string;
  description: string;
  keyVerse: string;
  keyVerseReference: string;
  sourceFile: string;
  sourceType: 'overview' | 'pdf' | 'article';
  estimatedMinutes: number;
  objectives: string[];
  sourceIntroduction?: string[];
  sourceConclusion?: Array<{
    type: 'heading' | 'paragraph' | 'quote';
    text: string;
  }>;
  sections: Array<{
    title: string;
    summary: string;
    questions: StudyQuestion[];
  }>;
  responsePrompt: string;
  articleBlocks?: Block[] | null;
};
export type CourseResource = {
  code: string;
  title: string;
  fileName: string;
  type: 'html' | 'pdf';
  routeSlug: string | null;
  documentUrl: string;
};
export type CourseSupplement = {
  title: string;
  fileName: string;
  documentUrl: string;
};
export type StudyRoomCourse = {
  schemaVersion: number;
  generatedAt: string;
  title: string;
  scripture: string;
  overview: { title: string; description: string; guidance: string };
  parts: Array<{
    number: string;
    title: string;
    lessons: string;
    accent: string;
  }>;
  sections: Array<{ title: string; items: CourseResource[] }>;
  fullCourse: CourseSupplement;
  printableHtml: CourseSupplement;
  whereNext: CourseSupplement;
  lessons: StudyRoomLesson[];
};
export type StudyWork = {
  readingProgress: number;
  scrollRatio: number;
  responses: Record<string, string>;
  revealed: string[];
  notes: string;
  complete: boolean;
};
export const emptyStudyWork: StudyWork = {
  readingProgress: 0,
  scrollRatio: 0,
  responses: {},
  revealed: [],
  notes: '',
  complete: false,
};

export function absoluteContentUrl(url: string) {
  return new URL(url, SITE_ORIGIN).toString();
}

export const initialStudyRoomCourse = bundledCourse as StudyRoomCourse;

export function isStudyRoomCourse(value: unknown): value is StudyRoomCourse {
  if (!value || typeof value !== 'object') return false;
  const course = value as Partial<StudyRoomCourse>;
  return (
    course.schemaVersion === 1 &&
    Array.isArray(course.lessons) &&
    course.lessons.length > 0 &&
    course.lessons.every(
      lesson =>
        typeof lesson.slug === 'string' &&
        typeof lesson.code === 'string' &&
        typeof lesson.title === 'string' &&
        Array.isArray(lesson.sections) &&
        Array.isArray(lesson.objectives),
    ) &&
    Array.isArray(course.sections) &&
    Array.isArray(course.parts) &&
    typeof course.overview?.title === 'string' &&
    typeof course.fullCourse?.documentUrl === 'string' &&
    typeof course.printableHtml?.documentUrl === 'string' &&
    typeof course.whereNext?.documentUrl === 'string'
  );
}
