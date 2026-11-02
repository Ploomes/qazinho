import type { StorageKind } from '@/modules/Settings/types';
import type { ParseKeys } from 'i18next';

export const STORAGE_KINDS: { id: StorageKind; labelKey: ParseKeys }[] = [
  { id: 'videos', labelKey: 'SETTINGS.STORAGE_VIDEOS' },
  { id: 'screens', labelKey: 'SETTINGS.STORAGE_SCREENS' },
  { id: 'builds', labelKey: 'SETTINGS.STORAGE_BUILDS' },
  { id: 'other', labelKey: 'SETTINGS.STORAGE_OTHER' },
];
