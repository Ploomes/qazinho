import type { IHomePlan } from './IHomePlan';

/** Um plano escrito antes do app cuja história chegou para teste. */
export interface IHomeArrived extends IHomePlan {
  kind: 'arrived';
  key: string;
}
