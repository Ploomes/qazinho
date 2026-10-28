import type { IRunQuestion } from '@/shared/types';

/**
 * A pergunta que o agente de uma run espera, como a página a acompanha: o que a main
 * disse, e há quanto tempo o QA a deixou esperando.
 */
export interface ILiveQuestion extends IRunQuestion {
  waitedSec: number;
}
