import type { QaOutcome } from './QaOutcome';
import type { IRunQuestion } from '@/shared/types';

/** A question a run's agent waits on, as the page was told it, and how its wait ends. */
export interface IOpenQuestion {
  question: IRunQuestion;
  settle: (outcome: QaOutcome) => void;
}
