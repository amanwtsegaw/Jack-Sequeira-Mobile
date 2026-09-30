import { type ReadingLanguage } from '../design';
import amharicText from './am.static-text.json';
import englishText from './en.static-text.json';
import oromoText from './om.static-text.json';
import tigrinyaText from './tm.static-text.json';

type StaticTextValue = string | { [key: string]: StaticTextValue };
type StaticTextDictionary = typeof englishText;

const localizedTextByLanguage: Partial<
  Record<ReadingLanguage, Partial<StaticTextDictionary>>
> = {
  am: amharicText,
  en: englishText,
  om: oromoText,
  tm: tigrinyaText,
};

export type StaticText = StaticTextDictionary;

export function getStaticText(language: ReadingLanguage): StaticText {
  return mergeText(englishText, localizedTextByLanguage[language] ?? {});
}

export function formatStaticText(
  value: string,
  replacements: Record<string, string | number>,
) {
  return value.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(replacements, key)
      ? String(replacements[key])
      : match,
  );
}

function mergeText<T extends StaticTextValue>(
  fallback: T,
  localized: StaticTextValue | undefined,
): T {
  if (typeof fallback === 'string') {
    return (
      typeof localized === 'string' && localized.length > 0
        ? localized
        : fallback
    ) as T;
  }

  if (!localized || typeof localized === 'string') {
    return fallback;
  }

  const merged = { ...fallback } as Record<string, StaticTextValue>;
  Object.keys(fallback).forEach(key => {
    merged[key] = mergeText(fallback[key], localized[key]);
  });
  return merged as T;
}
