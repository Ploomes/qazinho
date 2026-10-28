import type { QaOutcome } from './QaOutcome';
import type { IRunQuestion } from '@/shared/types';

/**
 * Uma pergunta que o agente de uma run espera, como a página foi avisada, e como a espera
 * termina.
 */
export interface IOpenQuestion {
  question: IRunQuestion;
  settle: (outcome: QaOutcome) => void;
}
