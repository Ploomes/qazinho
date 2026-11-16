import { describe, expect, it } from 'vitest';
import { spentOf } from '@/main/classes/agents/AgentRunner/library';

const meter = { kind: 'chat', workspaceId: 'w1', projectId: 'p1' } as const;
const call = { meter, agentId: 'claude-code', model: 'sonnet', at: 1000 };

describe('spentOf', () => {
  it('reads each model the turn used, with its tokens and its list price', () => {
    const records = spentOf({
      ...call,
      line: {
        type: 'result',
        total_cost_usd: 0.05,
        modelUsage: {
          'claude-sonnet-5-5': {
            inputTokens: 3000,
            outputTokens: 400,
            cacheReadInputTokens: 20000,
            cacheCreationInputTokens: 5000,
            costUSD: 0.045,
          },
          'claude-haiku-5-5': { inputTokens: 900, outputTokens: 20, costUSD: 0.005 },
        },
      },
    });

    expect(records).toEqual([
      {
        at: 1000,
        agentId: 'claude-code',
        kind: 'chat',
        workspaceId: 'w1',
        projectId: 'p1',
        model: 'claude-sonnet-5-5',
        input: 3000,
        output: 400,
        cacheRead: 20000,
        cacheWrite: 5000,
        costUsd: 0.045,
      },
      expect.objectContaining({ model: 'claude-haiku-5-5', input: 900, cacheRead: 0 }),
    ]);
  });

  it('falls back to the totals of the line, on the model asked for, without a split', () => {
    const [record] = spentOf({
      ...call,
      line: {
        type: 'result',
        total_cost_usd: 0.02,
        usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100 },
      },
    });

    expect(record).toMatchObject({
      model: 'sonnet',
      input: 10,
      output: 5,
      cacheRead: 100,
      costUsd: 0.02,
    });
  });

  it('gives nothing for a line that is not the last, nor for a turn that spent nothing', () => {
    expect(spentOf({ ...call, line: { type: 'assistant' } })).toEqual([]);
    expect(spentOf({ ...call, line: { type: 'result', total_cost_usd: 0 } })).toEqual([]);
  });

  it('keeps the tokens of a turn whose price the agent did not say, with no cost', () => {
    const [record] = spentOf({
      ...call,
      line: {
        type: 'result',
        modelUsage: { 'claude-x': { inputTokens: 5, outputTokens: 1 } },
      },
    });

    expect(record?.costUsd).toBeNull();
  });
});
