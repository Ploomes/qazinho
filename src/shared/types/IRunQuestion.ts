import type { IVariableBrief } from './IVariableBrief';

/** A question a run's agent asked the QA and waits on, with the answers it offers. */
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
