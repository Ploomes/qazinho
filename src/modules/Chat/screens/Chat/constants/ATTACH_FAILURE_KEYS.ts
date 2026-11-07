import type { AttachFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const ATTACH_FAILURE_KEYS: Record<AttachFailure['reason'], ParseKeys> = {
  'too-many': 'CHAT.ATTACH_TOO_MANY',
  'too-big': 'CHAT.ATTACH_TOO_BIG',
  unreadable: 'CHAT.ATTACH_UNREADABLE',
  'no-bridge': 'CHAT.ATTACH_NO_BRIDGE',
};
