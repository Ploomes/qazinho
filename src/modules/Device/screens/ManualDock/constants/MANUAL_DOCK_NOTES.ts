import type { TargetKind } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const MANUAL_DOCK_NOTES = {
  web: { preparing: 'DOCK.PREPARING_WEB', use: 'DOCK.USE_WEB' },
  android: { preparing: 'DOCK.PREPARING_ANDROID', use: 'DOCK.USE_ANDROID' },
  ios: { preparing: 'DOCK.PREPARING_IOS', use: 'DOCK.USE_IOS' },
} as const satisfies Record<TargetKind, { preparing: ParseKeys; use: ParseKeys }>;
