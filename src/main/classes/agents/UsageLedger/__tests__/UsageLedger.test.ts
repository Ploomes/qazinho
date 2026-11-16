import type { IUsageRecord } from '@/shared/types';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UsageLedger } from '@/main/classes/agents/UsageLedger';

const DAY = 86_400_000;
const spendAt = (at: number): IUsageRecord => ({
  at,
  agentId: 'claude-code',
  kind: 'chat',
  workspaceId: 'w1',
  projectId: 'p1',
  model: 'claude-sonnet-5-5',
  input: 100,
  output: 10,
  cacheRead: 0,
  cacheWrite: 0,
  costUsd: 0.01,
});

const fileIn = () => join(mkdtempSync(join(tmpdir(), 'qazinho-usage-')), 'usage.jsonl');

describe('UsageLedger', () => {
  it('reads back what was spent since a moment, in order', async () => {
    const ledger = new UsageLedger({ file: fileIn() });

    void ledger.add([spendAt(1000)]);
    void ledger.add([spendAt(2000), spendAt(3000)]);

    expect((await ledger.read(2000)).map((one) => one.at)).toEqual([2000, 3000]);
  });

  it('reads nothing before anything was spent', async () => {
    expect(await new UsageLedger({ file: fileIn() }).read(0)).toEqual([]);
  });

  it('lets go of what is older than a year, and keeps the rest', async () => {
    const file = fileIn();
    const now = 400 * DAY;

    writeFileSync(
      file,
      `${JSON.stringify(spendAt(now - 366 * DAY))}\n${JSON.stringify(spendAt(now - DAY))}\n`,
    );

    const ledger = new UsageLedger({ file });

    await ledger.prune(now);

    expect((await ledger.read(0)).map((one) => one.at)).toEqual([now - DAY]);
    expect(readFileSync(file, 'utf8').trim().split('\n')).toHaveLength(1);
  });
});
