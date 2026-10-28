import type { IWorkspace } from '@/modules/Workspace/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/**
 * A chave e a contagem que o badge da sidebar lê: progresso ganha de bugs, bugs ganham do
 * plano; uma exploração conta as telas que alcançou.
 */
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
