import type { RunMode } from '@/shared/types';

/** Uma run que o QAzinho fechou no meio: do jeito que ia e os casos que faltaram. */
export interface IRunToContinue {
  runId: string;
  mode: RunMode;
  caseIds: string[];
}
