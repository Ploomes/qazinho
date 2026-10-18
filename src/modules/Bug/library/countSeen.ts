import type { IWorkspace } from '@/modules/Workspace';

/** How many runs in a row caught this step failing, this one included: a bug seen before carries more weight. */
export function countSeen(props: {
  workspace: IWorkspace;
  caseId: string;
  stepNumber: number;
}): number {
  const { workspace, caseId, stepNumber } = props;

  const before = workspace.runs.filter((run) =>
    run.cases.some(
      (runCase) =>
        runCase.id === caseId &&
        runCase.steps.some(
          (one) => one.number === stepNumber && one.verdict === 'failed',
        ),
    ),
  ).length;

  return before + 1;
}
