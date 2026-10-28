import type { IWorkspace } from '@/modules/Workspace';

/**
 * Quantas runs seguidas pegaram este passo falhando, esta incluída: um bug visto antes
 * pesa mais.
 */
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
