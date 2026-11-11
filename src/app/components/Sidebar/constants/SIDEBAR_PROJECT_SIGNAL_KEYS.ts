import type { PlanSignalKind } from '@/app/components/Sidebar/types';

export const SIDEBAR_PROJECT_SIGNAL_KEYS: Record<
  PlanSignalKind,
  | 'SIDEBAR.PROJECT_ASKING'
  | 'SIDEBAR.PROJECT_RUNNING'
  | 'SIDEBAR.PROJECT_PAUSED'
  | 'SIDEBAR.PROJECT_FAILED'
> = {
  asking: 'SIDEBAR.PROJECT_ASKING',
  running: 'SIDEBAR.PROJECT_RUNNING',
  paused: 'SIDEBAR.PROJECT_PAUSED',
  failed: 'SIDEBAR.PROJECT_FAILED',
};
