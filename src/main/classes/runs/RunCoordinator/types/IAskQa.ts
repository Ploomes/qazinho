import type { IWalkRun } from './IWalkRun';
import type { IQaQuestion } from '@salve-software/qazinho-harness';

/**
 * Uma pergunta que o agente faz ao QA no passo em que está, e o que ele ouve depois
 * quando respondida, ou quando nenhuma resposta veio.
 */
export interface IAskQa {
  run: IWalkRun;
  asked: IQaQuestion;
  at: { caseId: string; stepNumber: number; action: string };
  carryOn: string;
  noAnswer: string;
}
