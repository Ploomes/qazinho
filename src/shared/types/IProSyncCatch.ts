/**
 * Uma vez em que um bug foi pego, como vai à conta do QA: a run, o passo, a tela e o
 * momento.
 */
export interface IProSyncCatch {
  runId: string;
  runWhen: string;
  caseId: string;
  stepNumber: number;
  shotFile: string | null;
  at: number | null;
}
