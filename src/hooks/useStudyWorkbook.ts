import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyStudyWork, type StudyWork } from '../data/studyRoom';

const KEY = 'jack-sequeira-bible-study-workbook:en:v1';
type Workbook = { activeSlug?: string; lessons: Record<string, StudyWork> };
export function useStudyWorkbook() {
  const [book, setBook] = useState<Workbook>({ lessons: {} });
  const [ready, setReady] = useState(false);
  const latest = useRef(book);
  latest.current = book;
  const loaded = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (!active) return;
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Workbook;
            if (
              saved.lessons &&
              typeof saved.lessons === 'object' &&
              !Array.isArray(saved.lessons)
            ) {
              const lessons = Object.fromEntries(
                Object.entries(saved.lessons).map(([slug, work]) => [
                  slug,
                  {
                    readingProgress: Math.max(
                      0,
                      Math.min(100, Number(work?.readingProgress) || 0),
                    ),
                    scrollRatio: Math.max(
                      0,
                      Math.min(1, Number(work?.scrollRatio) || 0),
                    ),
                    notes: typeof work?.notes === 'string' ? work.notes : '',
                    complete: work?.complete === true,
                    responses: Object.fromEntries(
                      Object.entries(work?.responses ?? {}).filter(
                        ([, value]) => typeof value === 'string',
                      ),
                    ),
                    revealed: Array.isArray(work?.revealed)
                      ? work.revealed.filter(value => typeof value === 'string')
                      : [],
                  },
                ]),
              );
              const restored = {
                activeSlug:
                  typeof saved.activeSlug === 'string'
                    ? saved.activeSlug
                    : undefined,
                lessons,
              };
              latest.current = restored;
              setBook(restored);
            }
          } catch {
            /* Start a fresh workbook if device storage is damaged. */
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          loaded.current = true;
          setReady(true);
        }
      });
    return () => {
      active = false;
      if (loaded.current)
        void AsyncStorage.setItem(KEY, JSON.stringify(latest.current)).catch(
          () => undefined,
        );
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(KEY, JSON.stringify(book)).catch(
        () => undefined,
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [book, ready]);
  const update = useCallback(
    (slug: string, patch: Partial<StudyWork>) => {
      if (!ready) return;
      setBook(current => {
        const next = {
          ...current,
          lessons: {
            ...current.lessons,
            [slug]: { ...emptyStudyWork, ...current.lessons[slug], ...patch },
          },
        };
        latest.current = next;
        return next;
      });
    },
    [ready],
  );
  const activate = useCallback(
    (slug: string) => {
      if (!ready) return;
      setBook(current => {
        if (current.activeSlug === slug) return current;
        const next = { ...current, activeSlug: slug };
        latest.current = next;
        return next;
      });
    },
    [ready],
  );
  const recordReading = useCallback(
    (slug: string, ratio: number) => {
      if (!ready || !Number.isFinite(ratio)) return;
      const scrollRatio =
        Math.round(Math.max(0, Math.min(1, ratio)) * 1000) / 1000;
      const percentage =
        scrollRatio >= 0.995 ? 100 : Math.floor(scrollRatio * 100);
      setBook(current => {
        const previous = { ...emptyStudyWork, ...current.lessons[slug] };
        const readingProgress = Math.max(previous.readingProgress, percentage);
        const complete = previous.complete || percentage === 100;
        if (
          previous.scrollRatio === scrollRatio &&
          previous.readingProgress === readingProgress &&
          previous.complete === complete
        )
          return current;
        const next = {
          ...current,
          lessons: {
            ...current.lessons,
            [slug]: { ...previous, readingProgress, scrollRatio, complete },
          },
        };
        latest.current = next;
        return next;
      });
    },
    [ready],
  );
  return { book, ready, update, activate, recordReading };
}
