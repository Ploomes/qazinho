// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import {
  Agent,
  Assistant,
  Builds,
  Github,
  Integrations,
  Mcp,
  Run,
  Setup,
  Suites,
  Variables,
} from '@/services';

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
  variables: [],
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

  it('has no assistant to ask, and no tool call to carry out', async () => {
    expect(
      await Assistant.ask({
        agentId: 'claude-code',
        model: '',
        sessionId: null,
        text: 'hi',
        app: {
          screen: 'home',
          openWorkspaceId: null,
          openTab: null,
          openRunId: null,
          openBugId: null,
          language: 'en',
          theme: 'night',
          runAlert: 'system',
          agent: 'Claude Code',
          integrations: [],
          projects: [],
          workspaces: [],
        },
      }),
    ).toMatchObject({
      isError: true,
      text: 'QAzinho is not talking to the machine. Restart the app.',
    });
    expect(() => {
      Assistant.onToolCall(() => undefined)();
      Assistant.answer({ id: 'c-1', text: '', isError: false });
    }).not.toThrow();
  });

  it('builds nothing, and says why in words the QA reads', async () => {
    expect(
      await Builds.start({
        buildId: 'b-1',
        projectId: null,
        platform: 'android',
        repository: { owner: 'acme', name: 'loja-app' },
        branch: 'main',
        agentId: 'claude-code',
        model: '',
        language: 'en',
      }),
    ).toEqual({
      isBuilt: false,
      failure: {
        reason: 'agent',
        failure: {
          reason: 'other',
          said: 'QAzinho is not talking to the machine. Restart the app.',
        },
      },
    });
  });

  it('keeps no variable, and says it could not reach main', async () => {
    expect(await Variables.list()).toEqual([]);
    expect(
      await Variables.apply({
        projectId: 'p-1',
        changes: [
          {
            kind: 'save',
            name: 'LOGIN_PASSWORD',
            description: '',
            value: 'secret',
            from: null,
          },
        ],
      }),
    ).toEqual({ isSaved: false, failure: { reason: 'no-bridge' } });
    await expect(Variables.forget('p-1')).resolves.toBeUndefined();
  });

  it('has no recording to play or to save', async () => {
    expect(await Run.replayUrl({ workspaceId: 'w1', runId: 'r-01' })).toBeNull();
    expect(await Run.network({ workspaceId: 'w1', runId: 'r-01' })).toBeNull();
    expect(await Run.replayVideo({ workspaceId: 'w1', runId: 'r-01' })).toBeNull();
    expect(await Run.saveVideo({ name: 'r-01', data: new Uint8Array(4) })).toBe('failed');
    expect(await Run.saveReplay({ workspaceId: 'w1', runId: 'r-01', name: 'r-01' })).toBe(
      'failed',
    );
  });

  it('connects no suite, and knows of none', async () => {
    expect(await Suites.pick('p-1')).toEqual({ kind: 'cancelled' });
    expect(await Suites.of('p-1')).toBeNull();
    await expect(Suites.forget('p-1')).resolves.toBeUndefined();
  });
});
