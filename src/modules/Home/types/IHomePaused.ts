import type { IHomePlan } from './IHomePlan';

/** Uma run que o QA pausou. */
export interface IHomePaused extends IHomePlan {
  kind: 'paused';
}
