import type { IconName } from '@/shared/components/atoms/Icon/types';

export const SAVE_BUTTON = {
  idle: { icon: 'download', labelKey: 'COMMON.DOWNLOAD' },
  cancelled: { icon: 'download', labelKey: 'COMMON.DOWNLOAD' },
  saving: { icon: 'download', labelKey: 'COMMON.SAVING' },
  saved: { icon: 'check', labelKey: 'COMMON.SAVED' },
  failed: { icon: 'attention', labelKey: 'COMMON.SAVE_FAILED' },
} as const satisfies Record<string, { icon: IconName; labelKey: string }>;
