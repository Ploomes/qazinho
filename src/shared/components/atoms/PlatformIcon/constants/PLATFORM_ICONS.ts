import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { TargetKind } from '@/shared/types';

export const PLATFORM_ICONS = {
  web: 'web',
  android: 'android',
  ios: 'apple',
} as const satisfies Record<TargetKind, IconName>;
