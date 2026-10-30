import type { AgentSignInProgress } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentLogin } from '@/main/classes/agents/AgentLogin';

/**
 * `claude` e `codex` falsos. O login espera o navegador, representado por um arquivo
 * `allowed` que o teste escreve, e deixa uma marca de que entrou; o status lê essa marca
 * do jeito que cada CLI real responde: o Claude Code em JSON, o Codex numa linha.
 */
const FAKE_AGENT = String.raw`
import { existsSync, writeFileSync } from 'node:fs';

const [root, agent, ...args] = process.argv.slice(2);
const isStatus = args.includes('status');
const isIn = existsSync(root + '/signed-in');

if (isStatus) {
  if (agent === 'claude') console.log(JSON.stringify({ loggedIn: isIn }));
  else console.log(isIn ? 'Logged in using ChatGPT' : 'Not logged in');
  process.exit(agent === 'codex' && !isIn ? 1 : 0);
}

writeFileSync(root + '/pid', String(process.pid));
setInterval(() => {
  if (!existsSync(root + '/allowed')) return;
  writeFileSync(root + '/signed-in', '');
  console.log('Login successful.');
  process.exit(0);
}, 50);
`;

const terminals: ChildProcess[] = [];

afterEach(() => {
  for (const terminal of terminals.splice(0)) terminal.kill();
});

async function agentsWithFakes(props: { canOpen?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-login-'));
  const reported: AgentSignInProgress[] = [];
  const scripts: string[] = [];
  const bins = { 'claude-code': join(root, 'claude'), codex: join(root, 'codex') };

  await writeFile(join(root, 'agent.mjs'), FAKE_AGENT);

  for (const [agentId, bin] of Object.entries(bins)) {
    await writeFile(
      bin,
      `#!/bin/sh\necho "$@" >> "${root}/calls"\nexec "${process.execPath}" "${root}/agent.mjs" "${root}" "${agentId === 'codex' ? 'codex' : 'claude'}" "$@"\n`,
    );
    await chmod(bin, 0o755);
  }

  return {
    root,
    reported,
    scripts,
    login: new AgentLogin({
      findAgent: (agentId) =>
        Promise.resolve(agentId in bins ? bins[agentId as keyof typeof bins] : null),
      openScript: async (file) => {
        scripts.push(await readFile(file, 'utf8'));
        if (props.canOpen === false) return false;

        terminals.push(spawn('/bin/sh', [file], { stdio: 'ignore' }));

        return true;
      },
      onProgress: (progress) => {
        reported.push(progress);
      },
      folder: join(root, 'agent'),
      platform: 'linux',
    }),
    calls: async () =>
      (await readFile(join(root, 'calls'), 'utf8').catch(() => '')).trim().split('\n'),
    reach: async (step: 'browser') => {
      while (
        !reported.some((progress) => progress.phase === 'working' && progress.at === step)
      )
        await new Promise((later) => setTimeout(later, 50));
    },
    allow: () => writeFile(join(root, 'allowed'), ''),
  };
}

describe("signing in to the QA's Claude Code", () => {
  it("opens the agent's own login in a terminal, and ends signed in once the agent says so", async () => {
    const { login, reported, scripts, calls, reach, allow } = await agentsWithFakes();
    const signingIn = login.signIn('claude-code');

    await reach('browser');
    await allow();

    expect(await signingIn).toMatchObject({
      phase: 'connected',
      steps: ['start', 'browser'],
    });
    expect(scripts[0]).toContain("'auth' 'login' '--claudeai'");
    expect(scripts[0]).toContain('QAzinho notices once you are in');
    expect(await calls()).toContain('auth login --claudeai');
    expect(await calls()).toContain('auth status');

    const headsUp = reported.find(
      (progress) => progress.phase === 'working' && progress.opensAt !== null,
    );

    expect(headsUp).toMatchObject({ at: 'start' });
    expect(reported.indexOf(headsUp!)).toBeLessThan(
      reported.findIndex(
        (progress) => progress.phase === 'working' && progress.at === 'browser',
      ),
    );
  });

  it('stops waiting when the QA cancels, without claiming a sign-in', async () => {
    const { login, reach } = await agentsWithFakes();
    const signingIn = login.signIn('claude-code');

    await reach('browser');
    login.cancel('claude-code');

    expect(await signingIn).toMatchObject({ phase: 'cancelled' });
  });

  it('says it could not open a terminal, with the command to run', async () => {
    const { login, calls } = await agentsWithFakes({ canOpen: false });
    const ended = await login.signIn('claude-code');

    expect(ended).toMatchObject({ phase: 'failed', at: 'start', failure: 'terminal' });
    expect(ended.phase === 'failed' && ended.said).toMatch(
      /claude auth login --claudeai$/,
    );
    expect(await calls()).toEqual(['']);
  });
});

describe("signing in to the QA's Codex", () => {
  it("opens Codex's own login in a terminal, and reads its status line", async () => {
    const { login, calls, reach, allow } = await agentsWithFakes();
    const signingIn = login.signIn('codex');

    await reach('browser');
    await allow();

    expect(await signingIn).toMatchObject({ phase: 'connected' });
    expect(await calls()).toContain('login');
    expect(await calls()).toContain('login status');
  });
});

describe('an agent QAzinho cannot sign in', () => {
  it('says so, before opening anything', async () => {
    const { login, scripts } = await agentsWithFakes();

    expect(await login.signIn('future-cli')).toMatchObject({
      phase: 'failed',
      at: 'start',
      failure: 'unsupported',
    });
    expect(scripts).toEqual([]);
  });
});
