export type TabKey = 'home' | 'library' | 'audio' | 'video' | 'settings';
export type SearchScope = 'library' | 'audio' | 'video';

export type Route =
  | {name: 'home'}
  | {name: 'library'}
  | {name: 'audio'}
  | {name: 'video'}
  | {name: 'settings'}
  | {name: 'saved'}
  | {name: 'series'; seriesSlug: string}
  | {name: 'lesson'; seriesSlug: string; lessonSlug: string};

export const tabItems: Array<{key: TabKey; label: string; icon: string}> = [
  {key: 'home', label: 'Home', icon: '⌂'},
  {key: 'library', label: 'Read', icon: '≡'},
  {key: 'audio', label: 'Audio', icon: '♫'},
  {key: 'video', label: 'Video', icon: '▷'},
  {key: 'settings', label: 'Settings', icon: 'Aa'},
];

export function isReadRoute(route: Route) {
  return (
    route.name === 'library' ||
    route.name === 'series' ||
    route.name === 'lesson' ||
    route.name === 'saved'
  );
}
