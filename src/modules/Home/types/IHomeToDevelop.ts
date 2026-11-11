import type { IHomePlan } from './IHomePlan';

/** Um plano com casos que ainda não têm gravação. */
export interface IHomeToDevelop extends IHomePlan {
  kind: 'toDevelop';
  cases: number;
}
