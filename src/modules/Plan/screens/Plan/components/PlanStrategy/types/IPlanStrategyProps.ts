import type { IPlanStrategy } from '@/shared/types';

/** A estratégia de um plano: o que ele cobre, deixa de fora, onde roda, com que dados. */
export interface IPlanStrategyProps {
  strategy: IPlanStrategy;
}
