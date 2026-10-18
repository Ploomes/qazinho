import type { TargetKind } from '@/shared/types';

export const TARGET_NAME_KEYS = {
  web: 'PROJECT.WEB',
  android: 'PROJECT.ANDROID',
  ios: 'PROJECT.IOS',
} as const satisfies Record<TargetKind, string>;
