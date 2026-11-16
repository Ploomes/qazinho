import { describe, expect, it } from 'vitest';
import { usageRecordsOf } from '@/main/classes/agents/UsageLedger/library';

const record = {
  at: 1000,
  agentId: 'claude-code',
  kind: 'case',
  workspaceId: 'w1',
  projectId: null,
  model: 'claude-haiku-5-5',
  input: 10,
  output: 2,
  cacheRead: 300,
  cacheWrite: 0,
  costUsd: 0.001,
};

describe('usageRecordsOf', () => {
  it('reads one spend per line', () => {
    const text = `${JSON.stringify(record)}\n${JSON.stringify({ ...record, at: 2000, costUsd: null })}\n`;

    expect(usageRecordsOf(text).map((one) => one.at)).toEqual([1000, 2000]);
  });

  /** Um app fechado no meio de uma escrita deixa a última linha pela metade. */
  it('leaves out a line cut in half, one of another shape, and blank lines', () => {
    const text = [
      JSON.stringify(record),
      '{"at":3000,"agentId":"claude',
      JSON.stringify({ ...record, kind: 'dance' }),
      JSON.stringify({ ...record, input: -4 }),
      '',
    ].join('\n');

    expect(usageRecordsOf(text)).toEqual([record]);
  });
});
