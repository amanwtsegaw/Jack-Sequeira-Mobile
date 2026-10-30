import { fontScaleOptions, getValueIndex, lineHeightOptions } from '../design';

export function labelForScale(value: number) {
  const labels = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  return labels[getValueIndex(fontScaleOptions, value)] ?? 'M';
}

export function labelForLineHeight(value: number) {
  const labels = [
    'Extra tight',
    'Tight',
    'Close',
    'Snug',
    'Compact',
    'Comfortable',
    'Balanced',
    'Open',
    'Wide',
    'Spacious',
    'Extra wide',
    'Maximum',
  ];
  return labels[getValueIndex(lineHeightOptions, value)] ?? 'Compact';
}

export function matchesQuery(value: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return value.toLowerCase().includes(normalized);
}
