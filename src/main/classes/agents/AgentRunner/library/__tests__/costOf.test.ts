import type { IAgentLine } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { costOf } from '@/main/classes/agents/AgentRunner/library';

describe('costOf', () => {
  it('reads what the closing line says the turn cost', () => {
    expect(costOf({ type: 'result', total_cost_usd: 0.0128 })).toBe(0.0128);
  });

  it('reads the cost of a turn that was interrupted, which still closes with it', () => {
    const interrupted: IAgentLine = {
      type: 'result',
      subtype: 'error_during_execution',
      is_error: true,
      total_cost_usd: 0.00013,
    };

    expect(costOf(interrupted)).toBe(0.00013);
  });

  it('does NOT read a cost off a line that is not the closing one', () => {
    expect(costOf({ type: 'assistant', total_cost_usd: 1 })).toBeNull();
  });

  it('says nothing when the agent did not say, rather than zero', () => {
    expect(costOf({ type: 'result' })).toBeNull();
    expect(costOf({ type: 'result', total_cost_usd: Number.NaN })).toBeNull();
  });
});
