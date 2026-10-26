import type { ParseKeys } from 'i18next';

export const VIDEO_KEEPING: { id: string; days: number | null; labelKey: ParseKeys }[] = [
  { id: '7', days: 7, labelKey: 'SETTINGS.KEEP_7' },
  { id: '30', days: 30, labelKey: 'SETTINGS.KEEP_30' },
  { id: '90', days: 90, labelKey: 'SETTINGS.KEEP_90' },
  { id: 'always', days: null, labelKey: 'SETTINGS.KEEP_ALWAYS' },
];
