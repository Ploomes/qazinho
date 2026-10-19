import type { IWorkspace } from '@/modules/Workspace/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/** The key and the count the sidebar badge reads: progress beats bugs, bugs beat the plan. */
export function workspaceMeta(workspace: IWorkspace): { key: string; count: number } {
  const steps = flattenPlanSteps(workspace.plan);

  if (workspace.live?.isRunning)
    return { key: 'SIDEBAR.META_PROGRESS', count: steps.length };
  if (workspace.bugs.length === 1) return { key: 'SIDEBAR.META_BUG_ONE', count: 1 };
  if (workspace.bugs.length > 1)
    return { key: 'SIDEBAR.META_BUG_OTHER', count: workspace.bugs.length };
  if (steps.length === 1) return { key: 'SIDEBAR.META_STEPS_ONE', count: 1 };
  if (steps.length > 1) return { key: 'SIDEBAR.META_STEPS_OTHER', count: steps.length };

  return { key: 'SIDEBAR.META_NEW', count: 0 };
}
