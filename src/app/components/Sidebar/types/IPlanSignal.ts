import type { PlanSignalKind } from './PlanSignalKind';

/** O sinal de um plano e, para os bugs abertos, quantos são. */
export interface IPlanSignal {
  kind: PlanSignalKind;
  count: number;
}
