import type { RunAnswer } from '@/shared/types';

/**
 * A question the run's agent asked the QA, kept in the run's section once it ended: what
 * it asked, at which step, and how it was answered.
 */
export interface IAskMessage {
  id: string;
  kind: 'ask';
  at: string;
  runId: string;
  askId: string;
  question: string;
  caseId: string;
  stepNumber: number;
  answer: RunAnswer;
}
