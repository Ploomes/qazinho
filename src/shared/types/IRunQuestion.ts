import type { IVariableBrief } from './IVariableBrief';

/**
 * Uma pergunta que o agente de uma run fez ao QA e espera, com as respostas que ela
 * oferece.
 */
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
