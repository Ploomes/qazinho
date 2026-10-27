import type { IAgentLine } from '@/main/types';

/**
 * What the agent says a turn cost, in US dollars, from its closing line; null on any
 * other line.
 */
export function costOf(line: IAgentLine): number | null {
  if (line.type !== 'result') return null;

  const cost = line.total_cost_usd;

  return typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null;
}
