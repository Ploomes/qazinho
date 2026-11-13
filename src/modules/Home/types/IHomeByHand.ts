import type { IHomePlan } from './IHomePlan';

/** Um plano com casos à mão que o QA não fez desde a última run dele, e o primeiro. */
export interface IHomeByHand extends IHomePlan {
  kind: 'byHand';
  cases: number;
  caseId: string;
}
