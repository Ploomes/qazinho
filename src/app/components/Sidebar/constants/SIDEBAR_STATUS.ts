import type { WorkspaceStatus } from '@/modules/Workspace';
import type { IconName } from '@/shared/components/atoms/Icon/types';

export const SIDEBAR_STATUS: Record<
  WorkspaceStatus | 'paused',
  { icon: IconName; tone: string; animation: string }
> = {
  running: {
    icon: 'play',
    tone: 'var(--lime-ink)',
    animation: 'gc-pulse 1.8s ease-in-out infinite',
  },
  paused: { icon: 'pause', tone: 'var(--attn)', animation: 'none' },
  attention: {
    icon: 'attention',
    tone: 'var(--attn)',
    animation: 'gc-blink 2.4s ease-in-out infinite',
  },
  failed: { icon: 'close', tone: 'var(--fail)', animation: 'none' },
  passed: { icon: 'check', tone: 'var(--pass)', animation: 'none' },
  stopped: { icon: 'stop', tone: 'var(--ink3)', animation: 'none' },
  idle: { icon: 'idle', tone: 'var(--ink3)', animation: 'none' },
};
