import type { IVariableBrief } from './IVariableBrief';

/** A question a run's agent asked the QA and waits on: what it asked at which step, the answers it offers, whether it asked for a secret, the variable a secret answer is typed as, and until when it waits. */
export interface IRunQuestion {
  id: string;
  question: string;
  options: string[];
  isSecret: boolean;
  secret: IVariableBrief;
  caseId: string;
  stepNumber: number;
  action: string;
  askedAtMs: number;
  waitsUntilMs: number;
}
