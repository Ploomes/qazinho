import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';
import type { ParseKeys } from 'i18next';

export const STATUS: Record<
  PillStatus,
  { icon: IconName; labelKey: ParseKeys; tone: string }
> = {
  running: { icon: 'play', labelKey: 'STATUS.RUNNING', tone: 'lime' },
  paused: { icon: 'pause', labelKey: 'STATUS.PAUSED', tone: 'attn' },
  attention: { icon: 'attention', labelKey: 'STATUS.NEEDS_YOU', tone: 'attn' },
  failed: { icon: 'close', labelKey: 'STATUS.FAILED', tone: 'fail' },
  passed: { icon: 'check', labelKey: 'STATUS.PASSED', tone: 'pass' },
  blocked: { icon: 'blocked', labelKey: 'STATUS.BLOCKED', tone: 'block' },
  skipped: { icon: 'skip', labelKey: 'STATUS.SKIPPED', tone: 'skip' },
  stopped: { icon: 'stop', labelKey: 'STATUS.STOPPED', tone: 'quiet' },
  idle: { icon: 'idle', labelKey: 'STATUS.IDLE', tone: 'quiet' },
  pending: { icon: 'pending', labelKey: 'STATUS.NOT_RUN', tone: 'quiet' },
};
