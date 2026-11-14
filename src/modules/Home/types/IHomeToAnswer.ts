import type { IHomePlan } from './IHomePlan';

/** Um plano cujo chat espera as respostas do QA a uma rodada de perguntas do agente. */
export interface IHomeToAnswer extends IHomePlan {
  kind: 'toAnswer';
  questions: number;
}
