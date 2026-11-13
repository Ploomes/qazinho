import type { IHomePlan } from './IHomePlan';

/** Um plano cujas fontes mudaram depois dele, e quantas trocas propostas esperam o QA. */
export interface IHomeChanged extends IHomePlan {
  kind: 'changed';
  sources: string[];
  toReview: number;
}
