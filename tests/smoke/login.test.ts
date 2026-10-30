import type { AgentSignInProgress } from '@/shared/types';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentLogin } from '@/main/classes/agents/AgentLogin';

const AUTOMATIC =
  'https://claude.com/cai/oauth/authorize?code=true&redirect_uri=http%3A%2F%2Flocalhost%3A61350%2Fcallback';
const MANUAL =
  'https://claude.com/cai/oauth/authorize?code=true&redirect_uri=https%3A%2F%2Fplatform.claude.com%2Foauth%2Fcode%2Fcallback';
const CODEX_PAGE =
  'https://auth.openai.com/oauth/authorize?response_type=code&client_id=abc';

/**
 * `claude auth login` e `codex login` como os reais se comportam (lido das duas CLIs): o
 * Claude Code entrega ao $BROWSER a página que chama de volta o localhost, imprime uma
 * segunda página que mostra um código, e espera esse código no stdin; o Codex abre a
 * página dele sozinho e só a imprime. Cada um espera o navegador: um arquivo chamado
 * `allowed` ou `denied` representa a resposta do QA.
 */
const FAKE_LOGIN = String.raw`
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const [root, agent] = process.argv.slice(2);
writeFileSync(root + '/pid', String(process.pid));

if (agent === 'claude') {
  console.log('Opening browser to sign in…');
  spawnSync(process.env.BROWSER, ['${AUTOMATIC}']);
  console.log("If the browser didn't open, visit: ${MANUAL}");
  process.stdout.write('Paste code here if prompted > ');
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (code) => {
    if (code.trim() === 'good-code') {
      console.log('Login successful.');
      process.exit(0);
    }
    console.log('Invalid code');
    process.exit(1);
  });
} else {
  console.log('Starting local login server on http://localhost:1455.');
  console.log('If your browser did not open, navigate to this URL to authenticate:');
  console.log('');
  console.log('${CODEX_PAGE}');
}

setInterval(() => {
  if (existsSync(root + '/allowed')) {
    console.log('Successfully logged in');
    process.exit(0);
  }
  if (existsSync(root + '/denied')) {
    console.error('Error logging in: access_denied');
    process.exit(1);
  }
}, 50);
`;

async function agentsWithFakes() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-login-'));
  const opened: string[] = [];
  const reported: AgentSignInProgress[] = [];
  const bins = { 'claude-code': join(root, 'claude'), codex: join(root, 'codex') };

  await writeFile(join(root, 'login.mjs'), FAKE_LOGIN);

  for (const [agentId, bin] of Object.entries(bins)) {
    await writeFile(
      bin,
      `#!/bin/sh\necho "$@" >> "${root}/calls"\nexec "${process.execPath}" "${root}/login.mjs" "${root}" "${agentId === 'codex' ? 'codex' : 'claude'}"\n`,
    );
    await chmod(bin, 0o755);
  }

  return {
    root,
    opened,
    reported,
    login: new AgentLogin({
      findAgent: (agentId) =>
        Promise.resolve(agentId in bins ? bins[agentId as keyof typeof bins] : null),
      openUrl: async (url) => {
        opened.push(url);
      },
      onProgress: (progress) => {
        reported.push(progress);
      },
      folder: join(root, 'agent'),
    }),
    calls: async () => (await readFile(join(root, 'calls'), 'utf8')).trim(),
    reach: async (step: 'browser') => {
      while (
        !reported.some((progress) => progress.phase === 'working' && progress.at === step)
      )
        await new Promise((later) => setTimeout(later, 50));
    },
    answer: (said: 'allowed' | 'denied') => writeFile(join(root, said), ''),
  };
}

const isGone = async (root: string) => {
  try {
    process.kill(Number(await readFile(join(root, 'pid'), 'utf8')), 0);

    return false;
  } catch {
    return true;
  }
};

describe("signing in to the QA's Claude Code", () => {
  it('opens the page the agent asked the browser for, and ends signed in once allowed', async () => {
    const { login, opened, reported, calls, reach, answer } = await agentsWithFakes();
    const signingIn = login.signIn('claude-code');

    await reach('browser');
    await answer('allowed');

    expect(await signingIn).toMatchObject({
      phase: 'connected',
      steps: ['start', 'browser'],
    });
    expect(await calls()).toBe('auth login --claudeai');
    expect(opened).toEqual([AUTOMATIC]);

    const headsUp = reported.find(
      (progress) => progress.phase === 'working' && progress.opensAt !== null,
    );

    expect(headsUp).toMatchObject({ at: 'start' });
    expect(reported.indexOf(headsUp!)).toBeLessThan(
      reported.findIndex(
        (progress) => progress.phase === 'working' && progress.at === 'browser',
      ),
    );
    expect(
      reported.find(
        (progress) => progress.phase === 'working' && progress.at === 'browser',
      ),
    ).toMatchObject({ url: AUTOMATIC });
  });

  it('cancels while the QA is in the browser, and leaves nothing running', async () => {
    const { login, reach, root } = await agentsWithFakes();
    const signingIn = login.signIn('claude-code');

    await reach('browser');
    login.cancel('claude-code');

    expect(await signingIn).toMatchObject({ phase: 'cancelled' });

    await new Promise((later) => setTimeout(later, 300));

    expect(await isGone(root)).toBe(true);
  });
});

describe("signing in to the QA's Codex", () => {
  it('points at the page Codex opened itself, without opening it twice', async () => {
    const { login, opened, reported, calls, reach, answer } = await agentsWithFakes();
    const signingIn = login.signIn('codex');

    await reach('browser');
    await answer('allowed');

    expect(await signingIn).toMatchObject({ phase: 'connected' });
    expect(await calls()).toBe('login');
    expect(opened).toEqual([]);
    expect(
      reported.find(
        (progress) => progress.phase === 'working' && progress.at === 'browser',
      ),
    ).toMatchObject({ url: CODEX_PAGE });
  });

  it('stops with what Codex said when the QA did not allow it', async () => {
    const { login, reach, answer } = await agentsWithFakes();
    const signingIn = login.signIn('codex');

    await reach('browser');
    await answer('denied');

    const ended = await signingIn;

    expect(ended).toMatchObject({ phase: 'failed', failure: 'refused' });
    expect(ended.phase === 'failed' && ended.said).toContain('access_denied');
  });
});

describe('an agent QAzinho cannot sign in', () => {
  it('says so, before running anything', async () => {
    const { login } = await agentsWithFakes();

    expect(await login.signIn('future-cli')).toMatchObject({
      phase: 'failed',
      at: 'start',
      failure: 'unsupported',
    });
  });
});
