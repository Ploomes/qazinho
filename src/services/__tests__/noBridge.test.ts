// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { Agent, Github, Integrations, Mcp, Run, Setup } from '@/services';

/**
 * The page opened with no bridge, in a plain browser, has nothing to ask. Each service says so
 * instead of crashing, and says it in the language the QA reads.
 */
afterEach(async () => {
  await i18n.changeLanguage('en');
});

const ASK = {
  workspaceId: 'w1',
  agentId: 'claude-code',
  model: '',
  sessionId: null,
  text: 'hi',
  target: null,
  viewport: null,
  steps: [],
  references: [],
  runs: [],
  code: null,
};

describe('a page with no bridge', () => {
  it('answers the chat with an error, never a verdict', async () => {
    expect(await Agent.ask(ASK)).toMatchObject({
      isError: true,
      text: 'QAzinho is not talking to the machine. Restart the app.',
    });
  });

  it("says it in the QA's language, wherever the QA asked", async () => {
    await i18n.changeLanguage('pt');

    const said = 'O QAzinho não está falando com a máquina. Reinicie o app.';

    expect(await Agent.ask(ASK)).toMatchObject({ text: said });
    expect(await Integrations.connect({ id: 'github' })).toEqual({
      isConnected: false,
      error: said,
    });
    expect(await Mcp.remove({ agentId: 'claude-code', id: 'figma' })).toEqual({
      ok: false,
      error: said,
    });
    expect(await Setup.install('claude-code')).toMatchObject({ error: said });
  });

  it('has no GitHub CLI to reach GitHub through, and signs nothing in', async () => {
    expect(await Github.status()).toMatchObject({ account: null, failure: 'no-cli' });
    expect(await Github.signIn()).toMatchObject({ phase: 'failed', failure: 'missing' });
    expect(await Github.repositories()).toEqual({ isListed: false, failure: 'no-cli' });
    expect(await Github.branches({ owner: 'acme', name: 'loja-web' })).toEqual({
      isListed: false,
      failure: 'no-cli',
    });
  });

  it('has no recording to play or to save', async () => {
    expect(await Run.replayUrl({ workspaceId: 'w1', runId: 'r-01' })).toBeNull();
    expect(await Run.saveReplay({ workspaceId: 'w1', runId: 'r-01', name: 'r-01' })).toBe(
      'failed',
    );
  });
});
