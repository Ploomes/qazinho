import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ProSyncState } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PRO_SYNC_STATES: Record<
  ProSyncState,
  {
    icon: IconName;
    tone: 'pass' | 'live' | 'attn' | 'fail' | 'quiet';
    labelKey: ParseKeys;
  }
> = {
  off: { icon: 'idle', tone: 'quiet', labelKey: 'PRO.SYNC_OFF' },
  synced: { icon: 'passed', tone: 'pass', labelKey: 'PRO.SYNC_SYNCED' },
  sending: { icon: 'running', tone: 'live', labelKey: 'PRO.SYNC_SENDING' },
  waiting: { icon: 'paused', tone: 'quiet', labelKey: 'PRO.SYNC_WAITING' },
  conflict: { icon: 'attention', tone: 'attn', labelKey: 'PRO.SYNC_CONFLICT' },
  blocked: { icon: 'blocked', tone: 'fail', labelKey: 'PRO.SYNC_BLOCKED' },
  'read-only': { icon: 'lock', tone: 'quiet', labelKey: 'PRO.SYNC_READ_ONLY' },
  'signed-out': { icon: 'stopped', tone: 'quiet', labelKey: 'PRO.SYNC_SIGNED_OUT' },
  failed: { icon: 'failed', tone: 'fail', labelKey: 'PRO.SYNC_FAILED' },
};
