import type { PlanSignalKind } from '@/app/components/Sidebar/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';

export const SIDEBAR_SIGNAL: Record<
  PlanSignalKind,
  { icon: IconName; tone: string; animation: string }
> = {
  asking: {
    icon: 'attention',
    tone: 'var(--attn)',
    animation: 'gc-blink 2.4s ease-in-out infinite',
  },
  running: {
    icon: 'running',
    tone: 'var(--lime-ink)',
    animation: 'gc-pulse 1.8s ease-in-out infinite',
  },
  paused: { icon: 'paused', tone: 'var(--attn)', animation: 'none' },
  bugs: { icon: 'bug', tone: 'var(--fail)', animation: 'none' },
  failed: { icon: 'failed', tone: 'var(--fail)', animation: 'none' },
};
