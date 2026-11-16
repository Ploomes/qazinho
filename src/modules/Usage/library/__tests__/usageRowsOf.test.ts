import { describe, expect, it } from 'vitest';
import { usageRowsOf } from '@/modules/Usage/library';
import { spend } from './fixtures';

const records = [
  spend({ kind: 'chat', costUsd: 0.1 }),
  spend({ kind: 'case', costUsd: 0.9 }),
  spend({ kind: 'case', costUsd: 0.3 }),
  spend({ kind: 'explore', agentId: 'codex', costUsd: null, input: 90_000 }),
];

describe('usageRowsOf', () => {
  it('splits by the key of each spend, the one that cost the most first', () => {
    const rows = usageRowsOf({ records, keyOf: (record) => record.kind, metric: 'cost' });

    expect(rows.map((row) => [row.key, row.costUsd])).toEqual([
      ['case', 1.2],
      ['chat', 0.1],
      ['explore', null],
    ]);
  });

  it('puts the part with the most tokens first when measuring tokens', () => {
    const rows = usageRowsOf({
      records,
      keyOf: (record) => record.kind,
      metric: 'tokens',
    });

    expect(rows[0]).toEqual({ key: 'explore', costUsd: null, tokens: 91_100 });
  });
});
