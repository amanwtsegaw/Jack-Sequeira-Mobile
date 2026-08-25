export type TabKey = 'home' | 'library' | 'audio' | 'video' | 'settings';
export type TabIcon = 'home' | 'book-open' | 'audio' | 'video' | 'settings';
export type SearchScope = 'library' | 'audio' | 'video';
export type ReadSection = 'study-materials' | 'bible-courses';

export type Route =
  | {name: 'home'}
  | {name: 'about'}
  | {name: 'library'; section?: ReadSection}
  | {name: 'audio'; collectionKey?: string; trackFileName?: string}
  | {name: 'video'}
  | {name: 'settings'}
  | {name: 'saved'}
  | {name: 'series'; seriesSlug: string}
  | {
      name: 'lesson';
      seriesSlug: string;
      lessonSlug: string;
      searchQuery?: string;
      searchNonce?: number;
    };

export const tabItems: Array<{key: TabKey; label: string; icon: TabIcon}> = [
  {key: 'home', label: 'Home', icon: 'home'},
  {key: 'library', label: 'Read', icon: 'book-open'},
  {key: 'audio', label: 'Audio', icon: 'audio'},
  {key: 'video', label: 'Video', icon: 'video'},
  {key: 'settings', label: 'Settings', icon: 'settings'},
];

export function isReadRoute(route: Route) {
  return (
    route.name === 'library' ||
    route.name === 'series' ||
    route.name === 'lesson' ||
    route.name === 'saved'
  );
}
