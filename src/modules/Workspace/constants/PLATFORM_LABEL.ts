import type { TargetKind } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PLATFORM_LABEL: Record<TargetKind, ParseKeys> = {
  web: 'PROJECT.WEB',
  android: 'PROJECT.ANDROID',
  ios: 'PROJECT.IOS',
};
