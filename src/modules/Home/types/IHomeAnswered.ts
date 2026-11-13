import type { IHomePlan } from './IHomePlan';

/** Um plano com dúvidas que o time respondeu na história e que ainda seguram casos. */
export interface IHomeAnswered extends IHomePlan {
  kind: 'answered';
  ids: string[];
}
