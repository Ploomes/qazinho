import type { IWorkspace } from '@/modules/Workspace/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/** What the sidebar badge says: progress beats bugs, bugs beat the plan's size. */
export function workspaceMeta(workspace: IWorkspace): string {
  const steps = flattenPlanSteps(workspace.plan);

  if (workspace.live?.isRunning)
    return `${String(workspace.live.stepIndex)}/${String(steps.length)}`;
  if (workspace.bugs.length === 1) return '1 bug';
  if (workspace.bugs.length > 1) return `${String(workspace.bugs.length)} bugs`;
  if (steps.length > 0) return `${String(steps.length)} steps`;

  return 'new';
}
