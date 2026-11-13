import type { IHomePlan } from './IHomePlan';

/** Um plano de uma história que o agente escreve agora, ou que espera a vez dele. */
export interface IHomeDrafting extends IHomePlan {
  kind: 'drafting';
  key: string;
  isQueued: boolean;
}
