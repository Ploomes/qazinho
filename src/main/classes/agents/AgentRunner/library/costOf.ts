import type { IAgentLine } from '@/main/types';

/**
 * O que o agente diz que um turno custou, em dólares, pela linha final dele; null em
 * qualquer outra linha.
 */
export function costOf(line: IAgentLine): number | null {
  if (line.type !== 'result') return null;

  const cost = line.total_cost_usd;

  return typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null;
}
