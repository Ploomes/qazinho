import type { RunAnswer } from './RunAnswer';

/** A question a run's agent asked the QA, at the step it was on, and how it ended. */
export interface IRunAsked {
  id: string;
  question: string;
  caseId: string;
  stepNumber: number;
  answer: RunAnswer;
  askedAtMs: number;
  answeredAtMs: number;
}
