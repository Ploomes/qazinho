import type { ProSyncState } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PANE_STATE_KEYS: Partial<Record<ProSyncState, ParseKeys>> = {
  sending: 'PRO.PANE_STATE_SENDING',
  waiting: 'PRO.PANE_STATE_WAITING',
  blocked: 'PRO.PANE_STATE_BLOCKED',
  'read-only': 'PRO.PANE_STATE_READ_ONLY',
  'signed-out': 'PRO.PANE_STATE_SIGNED_OUT',
  failed: 'PRO.PANE_STATE_FAILED',
  gone: 'PRO.PANE_STATE_GONE',
  'no-access': 'PRO.PANE_STATE_NO_ACCESS',
};
