import { describe, expect, it } from 'vitest';
import { UsageReader } from '@/main/classes/agents/UsageReader';

const PRINTED = JSON.stringify({
  type: 'result',
  subtype: 'success',
  total_cost_usd: 0,
  result:
    'Current session: 71% used · resets Oct 21 at 8am (America/Sao_Paulo)\nCurrent week (all models): 24% used',
});

/** A reader over a fake CLI that prints what it is handed, and remembers how it was called. */
function reader(props: { printed?: string | Error; path?: string | null } = {}) {
  const calls: { command: string; args: readonly string[]; cwd: string }[] = [];
  const usage = new UsageReader({
    findAgent: () =>
      Promise.resolve(props.path === undefined ? '/bin/claude' : props.path),
    folder: '/data/agent',
    exec: ({ command, args, cwd }) => {
      calls.push({ command, args, cwd });

      return props.printed instanceof Error
        ? Promise.reject(props.printed)
        : Promise.resolve(props.printed ?? PRINTED);
    },
    now: () => new Date(2026, 9, 21, 7, 0),
  });

  return { usage, calls };
}

describe('UsageReader', () => {
  it("reads Claude Code's own /usage, in QAzinho's folder, with the QA's hooks off", async () => {
    const { usage, calls } = reader();

    expect(await usage.read('claude-code')).toEqual({
      fiveHourUsed: 0.71,
      sevenDayUsed: 0.24,
      resetsAt: Math.floor(new Date(2026, 9, 21, 8, 0).getTime() / 1_000),
    });
    expect(calls[0]).toMatchObject({ command: '/bin/claude', cwd: '/data/agent' });
    expect(calls[0]?.args.at(-1)).toBe('/usage');
    expect(calls[0]?.args).toContain('{"disableAllHooks":true}');
  });

  it('does NOT run an agent with no /usage, or one not installed', async () => {
    const codex = reader();
    const missing = reader({ path: null });

    expect(await codex.usage.read('codex')).toBeNull();
    expect(await missing.usage.read('claude-code')).toBeNull();
    expect([...codex.calls, ...missing.calls]).toEqual([]);
  });

  it('gives nothing when the CLI fails or prints something else', async () => {
    expect(
      await reader({ printed: new Error('signed out') }).usage.read('claude-code'),
    ).toBeNull();
    expect(await reader({ printed: 'not json' }).usage.read('claude-code')).toBeNull();
  });
});
