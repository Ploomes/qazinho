import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';
import type { ParseKeys } from 'i18next';

export const STATUS: Record<
  PillStatus,
  { icon: IconName; labelKey: ParseKeys; tone: string }
> = {
  running: { icon: 'running', labelKey: 'STATUS.RUNNING', tone: 'lime' },
  paused: { icon: 'paused', labelKey: 'STATUS.PAUSED', tone: 'attn' },
  attention: { icon: 'attention', labelKey: 'STATUS.NEEDS_YOU', tone: 'attn' },
  failed: { icon: 'failed', labelKey: 'STATUS.FAILED', tone: 'fail' },
  passed: { icon: 'passed', labelKey: 'STATUS.PASSED', tone: 'pass' },
  blocked: { icon: 'blocked', labelKey: 'STATUS.BLOCKED', tone: 'block' },
  skipped: { icon: 'skipped', labelKey: 'STATUS.SKIPPED', tone: 'skip' },
  stopped: { icon: 'stopped', labelKey: 'STATUS.STOPPED', tone: 'quiet' },
  idle: { icon: 'idle', labelKey: 'STATUS.IDLE', tone: 'quiet' },
  pending: { icon: 'pending', labelKey: 'STATUS.NOT_RUN', tone: 'quiet' },
};
