import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentTerminal } from '@/main/classes/agents/AgentTerminal';
import { TERMINAL_KEYS } from '@/main/classes/agents/AgentTerminal/constants';

/**
 * Um programa de tela cheia em modo raw, do jeito que a interface de um agente roda:
 * desenha um menu de duas linhas, move o ❯ com as setas, e no Enter pede ao $BROWSER para
 * abrir uma página, como o Claude Code faz.
 */
const PICKER = `
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
writeFileSync(process.argv[2], String(process.pid));
let at = 0;
let opened = false;
const draw = () => process.stdout.write('\\x1b[H\\x1b[2J' + (opened ? 'Opened' : ['one', 'two'].map((item, index) => (index === at ? '❯ ' : '  ') + item).join('\\r\\n')));
process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (keys) => {
  if (keys === '\\x1b[B') at = 1;
  if (keys === '\\x1b[A') at = 0;
  if (keys === '\\r') { spawnSync(process.env.BROWSER, ['https://example.test/page-' + String(at)]); opened = true; }
  draw();
});
draw();
`;

const isGone = (pid: number) => {
  try {
    process.kill(pid, 0);

    return false;
  } catch {
    return true;
  }
};

async function picker() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-terminal-'));
  const script = join(root, 'picker.mjs');
  const pidFile = join(root, 'pid');

  await writeFile(script, PICKER);

  return {
    root,
    pid: async () => Number(await readFile(pidFile, 'utf8')),
    terminal: await AgentTerminal.open({
      command: process.execPath,
      args: [script, pidFile],
      cwd: root,
      env: process.env,
    }),
  };
}

const selected = (rows: string[]) => rows.find((row) => row.includes('❯')) ?? null;

describe.skipIf(!existsSync('/usr/bin/expect'))('a program run out of sight', () => {
  it('shows its screen, takes its keys, and hands over the page it wanted to open', async () => {
    const { terminal, pid } = await picker();
    const signal = new AbortController().signal;

    expect(
      await terminal.waitFor({ read: ({ rows }) => selected(rows), ms: 10_000, signal }),
    ).toBe('❯ one');

    await terminal.press(TERMINAL_KEYS.down);

    expect(selected((await terminal.view()).rows)).toBe('❯ two');

    await terminal.press(TERMINAL_KEYS.enter);

    expect(
      await terminal.waitFor({
        read: ({ links }) => links[0] ?? null,
        ms: 10_000,
        signal,
      }),
    ).toBe('https://example.test/page-1');
    expect((await terminal.view()).rows[0]).toBe('Opened');

    const running = await pid();

    terminal.close();
    await new Promise((later) => setTimeout(later, 500));

    expect(isGone(running)).toBe(true);
  });

  it('stops waiting when told to, and when the program is gone', async () => {
    const { terminal } = await picker();
    const stop = new AbortController();
    const started = Date.now();

    setTimeout(() => {
      stop.abort();
    }, 300);

    expect(
      await terminal.waitFor({ read: () => null, ms: 10_000, signal: stop.signal }),
    ).toBe(null);
    expect(Date.now() - started).toBeLessThan(2_000);

    terminal.close();

    expect(
      await terminal.waitFor({
        read: () => null,
        ms: 10_000,
        signal: new AbortController().signal,
      }),
    ).toBe(null);
    expect((await terminal.view()).hasExited).toBe(true);
  });
});
