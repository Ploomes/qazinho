import type { RunAnswer } from './RunAnswer';

/**
 * Uma pergunta que o agente de uma run fez ao QA, no passo em que estava, e como
 * terminou.
 */
export interface IRunAsked {
  id: string;
  question: string;
  caseId: string;
  stepNumber: number;
  answer: RunAnswer;
  askedAtMs: number;
  answeredAtMs: number;
}
