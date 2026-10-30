import type { ArchiveLesson, ArchiveSeries } from '../data/archive';

export function sameContent(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Keep cached bodies until revalidation finishes, but use published ordering and metadata.
export function mergePublishedCatalog(
  published: ArchiveSeries[],
  cached: ArchiveSeries[],
): ArchiveSeries[] {
  return published.map(series => {
    const previous = cached.find(
      item => item.slug === series.slug && item.language === series.language,
    );
    const lessons = series.lessons.map(summary => {
      const full = previous?.lessons.find(
        item =>
          item.slug === summary.slug &&
          !item.sourcePath.startsWith('remote-summary:'),
      );
      return full
        ? {
            ...full,
            title: summary.title,
            description: summary.description,
            sequence: summary.sequence,
          }
        : summary;
    });
    return {
      ...series,
      lessons: series.lessons.length
        ? lessons
        : series.lessonCount === 0
        ? []
        : previous?.lessons ?? [],
    };
  });
}

export function retainUnchangedLesson(
  previous: ArchiveLesson | undefined,
  next: ArchiveLesson,
): ArchiveLesson {
  if (!previous) return next;
  if (sameContent(previous, next)) return previous;
  return {
    ...next,
    blocks: sameContent(previous.blocks, next.blocks)
      ? previous.blocks
      : next.blocks,
  };
}
