import type { IHomePlan } from './IHomePlan';

/** Uma run que o app fechou no meio, e quantos casos ela não terminou. */
export interface IHomeToContinue extends IHomePlan {
  kind: 'toContinue';
  cases: number;
}
