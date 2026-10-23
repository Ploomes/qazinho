import type { IWorkspace } from '@/modules/Workspace/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/** The key and the count the sidebar badge reads: progress beats bugs, bugs beat the plan; an exploration counts the screens it reached. */
export function workspaceMeta(workspace: IWorkspace): { key: string; count: number } {
  const steps = flattenPlanSteps(workspace.plan);

  if (workspace.live?.isRunning && workspace.live.kind === 'explore') {
    const screens = workspace.live.outcomes.length;

    return {
      key: screens === 1 ? 'CHAT.EXPLORE_SCREENS_ONE' : 'CHAT.EXPLORE_SCREENS_OTHER',
      count: screens,
    };
  }
  if (workspace.live?.isRunning)
    return { key: 'SIDEBAR.META_PROGRESS', count: steps.length };
  const bugs = workspace.bugs.filter(({ isDismissed }) => !isDismissed).length;

  if (bugs === 1) return { key: 'SIDEBAR.META_BUG_ONE', count: 1 };
  if (bugs > 1) return { key: 'SIDEBAR.META_BUG_OTHER', count: bugs };
  if (steps.length === 1) return { key: 'SIDEBAR.META_STEPS_ONE', count: 1 };
  if (steps.length > 1) return { key: 'SIDEBAR.META_STEPS_OTHER', count: steps.length };

  return { key: 'SIDEBAR.META_NEW', count: 0 };
}
