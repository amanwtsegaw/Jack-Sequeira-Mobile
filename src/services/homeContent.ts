import type { ArchiveSeries } from '../data/archive';
export function selectFeaturedSeries(series: ArchiveSeries[]) {
  const studies = series.filter(item => item.category !== 'bible-study');
  return (studies.length ? studies : series).slice(0, 5);
}
