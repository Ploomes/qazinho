import type { IWorkspace } from '@/modules/Workspace';

/**
 * Every case id the workspace ever used, in its plan, its runs and its bugs: a new case
 * never takes one of them.
 */
export function caseIdsUsed(
  workspace: Pick<IWorkspace, 'plan' | 'runs' | 'bugs'>,
): string[] {
  return [
    ...workspace.plan.map(({ id }) => id),
    ...workspace.runs.flatMap(({ cases }) => cases.map(({ id }) => id)),
    ...workspace.bugs.map(({ caseId }) => caseId),
  ];
}
