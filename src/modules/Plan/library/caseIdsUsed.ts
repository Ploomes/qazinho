import type { IWorkspace } from '@/modules/Workspace';

/**
 * Todo id de caso que o workspace já usou, no plano, nas runs e nos bugs: um caso novo
 * nunca pega um deles.
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
