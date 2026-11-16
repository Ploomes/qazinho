import { describe, expect, it } from 'vitest';
import { codexSpentOf } from '@/main/classes/agents/AgentRunner/library';

const call = {
  meter: { kind: 'case', workspaceId: 'w1', projectId: null },
  agentId: 'codex',
  model: 'gpt-5.5',
  at: 2000,
} as const;

describe('codexSpentOf', () => {
  /** O Codex conta os tokens lidos do cache dentro dos de entrada. */
  it('splits the cached tokens out of the input, with no cost', () => {
    expect(
      codexSpentOf({
        ...call,
        line: {
          type: 'turn.completed',
          usage: { input_tokens: 12000, cached_input_tokens: 9000, output_tokens: 300 },
        },
      }),
    ).toEqual([
      {
        at: 2000,
        agentId: 'codex',
        kind: 'case',
        workspaceId: 'w1',
        projectId: null,
        model: 'gpt-5.5',
        input: 3000,
        output: 300,
        cacheRead: 9000,
        cacheWrite: 0,
        costUsd: null,
      },
    ]);
  });

  it('gives nothing for another event, or a turn with no tokens', () => {
    expect(codexSpentOf({ ...call, line: { type: 'item.completed' } })).toEqual([]);
    expect(
      codexSpentOf({ ...call, line: { type: 'turn.completed', usage: {} } }),
    ).toEqual([]);
  });
});
