import type { TargetKind } from '@/types';
import type { ParseKeys } from 'i18next';

export const PLATFORM_LABEL: Record<TargetKind, ParseKeys> = {
  web: 'PROJECT.WEB',
  android: 'PROJECT.ANDROID',
  ios: 'PROJECT.IOS',
};
