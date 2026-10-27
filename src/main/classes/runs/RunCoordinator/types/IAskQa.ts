import type { IWalkRun } from './IWalkRun';
import type { IQaQuestion } from '@salve-software/qazinho-harness';

/**
 * A question the agent asks the QA at the step it is on, and what it hears next once
 * answered, or once no answer came.
 */
export interface IAskQa {
  run: IWalkRun;
  asked: IQaQuestion;
  at: { caseId: string; stepNumber: number; action: string };
  carryOn: string;
  noAnswer: string;
}
