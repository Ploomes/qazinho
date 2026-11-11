import type { IHomePlan } from './IHomePlan';

/** Uma run cujo agente espera a resposta do QA. */
export interface IHomeAsking extends IHomePlan {
  kind: 'asking';
  question: string;
}
