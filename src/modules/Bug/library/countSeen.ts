import type { IWorkspace } from '@/modules/Workspace';

/** A bug the QA has seen before carries more weight than one that showed up once. */
export function countSeen(props: {
  workspace: IWorkspace;
  caseId: string;
  step: string;
}): string {
  const { workspace, caseId, step } = props;

  const before = workspace.runs.filter((run) =>
    run.cases.some(
      (runCase) =>
        runCase.id === caseId &&
        runCase.steps.some(
          (one) => `step ${String(one.number)}` === step && one.verdict === 'failed',
        ),
    ),
  ).length;

  return before === 0 ? 'once' : `${String(before + 1)} runs in a row`;
}
