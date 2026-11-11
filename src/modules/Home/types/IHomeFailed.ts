import type { IHomePlan } from './IHomePlan';

/** Um plano cuja última run falhou, com os casos que falharam e os bugs abertos. */
export interface IHomeFailed extends IHomePlan {
  kind: 'failed';
  failed: number;
  bugs: number;
}
