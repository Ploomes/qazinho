// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import {
  Agent,
  Assistant,
  Bugs,
  Builds,
  Confluence,
  Files,
  Github,
  Integrations,
  Jira,
  Mcp,
  Pro,
  Run,
  Setup,
  Sites,
  Sources,
  Templates,
  Updates,
  Memories,
  Variables,
} from '@/services';

/**
 * A página aberta sem bridge, num navegador comum, não tem a quem perguntar. Cada service
 * diz isso em vez de quebrar, e diz no idioma que o QA lê.
 */
afterEach(async () => {
  await i18n.changeLanguage('en');
});

const ASK = {
  workspaceId: 'w1',
  projectId: 'p1',
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
  source: null,
  jira: null,
  confluence: null,
  design: null,
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
      failure: { reason: 'no-bridge' },
    });
    expect(await Mcp.remove({ agentId: 'claude-code', id: 'figma' })).toEqual({
      ok: false,
      error: said,
    });
    expect(await Setup.install('claude-code')).toMatchObject({
      failure: { reason: 'no-bridge' },
    });
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

  it('says this machine is signed out of QAzinho Pro, and that a sign-in did not start', async () => {
    expect(await Pro.status()).toEqual({ isSignedIn: false, canKeepToken: false });
    expect(await Pro.signIn()).toMatchObject({ phase: 'failed', failure: 'unexpected' });
    expect(await Pro.signOut()).toEqual({ isSignedIn: false, canKeepToken: false });
  });

  it('sends nothing to QAzinho Pro, publishes nothing and deletes nothing', async () => {
    const batch = {
      project: { projectId: 'p1', name: 'Loja', targets: [], repositories: [] },
      plans: [],
      runs: [],
      bugs: [],
      memories: [],
    };

    expect(await Pro.shares()).toEqual([]);
    expect(await Pro.sync(batch)).toMatchObject({ projectId: 'p1', state: 'off' });
    expect(
      await Pro.publish({ batch, orgSlug: 'loja', hasHistoryMedia: true }),
    ).toMatchObject({ projectId: 'p1', state: 'off' });
    expect(await Pro.sendPlans(batch)).toMatchObject({ state: 'off' });
    expect(await Pro.unlink('p1')).toMatchObject({ orgSlug: null, state: 'off' });
    expect(await Pro.remove('p1')).toEqual({ isRemoved: false, failure: 'failed' });
    expect(await Pro.brief(batch)).toEqual({
      plans: 0,
      runs: 0,
      bugs: 0,
      memories: 0,
      mediaBytes: 0,
      files: 0,
      fileBytes: 0,
    });
    expect(Pro.onSync(() => undefined)).toBeTypeOf('function');
    expect(
      await Pro.resolve({ projectId: 'p1', workspaceId: 'w1', version: 2 }),
    ).toMatchObject({ state: 'off' });
    expect(await Pro.orgProjects('loja')).toEqual({ isListed: false, failure: 'failed' });
    expect(await Pro.download({ orgSlug: 'loja', projectId: 'p1' })).toEqual({
      isDownloaded: false,
      failure: 'failed',
    });
    expect(await Pro.openPage('/loja')).toBe(false);
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
    expect(await Variables.reveal({ projectId: 'p-1', name: 'LOGIN_EMAIL' })).toBeNull();
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

  it('sends no bug to a tracker, and copies no screen', async () => {
    expect(
      await Bugs.file({
        filingId: 'f-1',
        target: { tracker: 'jira', project: 'SHOP' },
        story: null,
        report: { title: 'Coupon refused', blocks: [] },
        shots: [],
        video: null,
      }),
    ).toEqual({ isFiled: false, failure: 'not-connected', said: '' });
    expect(await Bugs.copyShot({ file: null, src: 'data:image/png;base64,' })).toBe(
      false,
    );
    expect(await Jira.projects()).toEqual({ isListed: false, failure: 'unreachable' });
    expect(await Jira.boards('')).toEqual({ isListed: false, failure: 'unreachable' });
    expect(await Jira.sprint(7)).toEqual({ isListed: false, failure: 'unreachable' });
    expect(await Templates.list()).toEqual([]);
    expect(await Files.saveText({ name: 'Cupom', extension: 'feature', text: '' })).toBe(
      'failed',
    );
    expect(
      await Templates.save({
        id: null,
        kind: 'bug',
        name: 'Bug',
        title: '',
        parts: [],
        cases: 'steps',
      }),
    ).toEqual({ isSaved: false, reason: 'unwritable' });
    expect(await Templates.remove('t-1')).toBe(false);
    expect(await Templates.listOrg('loja')).toEqual({
      isListed: false,
      failure: 'unreachable',
    });
    expect(await Templates.removeOrg({ orgSlug: 'loja', id: 'org:loja:t1' })).toEqual({
      isDone: false,
      failure: 'unreachable',
    });
    expect(await Jira.tell({ key: 'SHOP-878', text: 'Oi.' })).toEqual({
      isPosted: false,
      failure: 'unreachable',
      said: '',
    });
    expect(
      await Sources.read({
        workspaceId: 'w1',
        agentId: 'claude-code',
        model: 'haiku',
        brief: { changes: [], cases: [], doubts: [], language: 'en' },
      }),
    ).toEqual({ isRead: false, reason: 'agent-missing' });
    expect(
      await Sources.check({
        snapshots: [{ kind: 'story', key: 'SHOP-878', url: '', text: '', at: '' }],
        code: null,
      }),
    ).toEqual({
      changes: [],
      snapshots: [{ kind: 'story', key: 'SHOP-878', url: '', text: '', at: '' }],
      code: null,
      missed: ['SHOP-878'],
    });
    expect(await Jira.columns(1)).toEqual({ isListed: false, failure: 'unreachable' });
    expect(await Jira.status('SHOP-878')).toEqual({
      isRead: false,
      failure: 'unreachable',
    });
    expect(await Jira.people('SHOP-878')).toEqual({
      isRead: false,
      failure: 'unreachable',
    });
    expect(
      await Jira.askStory({
        key: 'SHOP-878',
        intro: '',
        doubts: [{ id: 'D1', question: 'Does a coupon stack?' }],
        closing: '',
        isWatching: true,
      }),
    ).toEqual({ isPosted: false, failure: 'unreachable', said: '' });
    expect(await Jira.answers({ key: 'SHOP-878', doubts: [] })).toEqual({
      isRead: false,
      failure: 'unreachable',
    });
    expect(await Confluence.turn(true)).toEqual({
      isSwitched: false,
      failure: 'unreachable',
      said: '',
    });
    expect(await Confluence.search('checkout')).toEqual({
      isListed: false,
      failure: 'unreachable',
    });
    expect(await Confluence.spaces()).toEqual({
      isListed: false,
      failure: 'unreachable',
    });
    expect(
      await Confluence.publish({
        pageId: null,
        spaceId: '1',
        parentId: null,
        title: 'Checkout',
        blocks: [],
      }),
    ).toEqual({ isPublished: false, failure: 'unreachable', said: '' });
    expect(
      await Bugs.comment({
        issue: { tracker: 'jira', key: 'SHOP-57', url: '', at: '' },
        report: { title: '', blocks: [] },
        shots: [],
        video: null,
      }),
    ).toEqual({ isPosted: false, failure: 'not-connected', said: '' });
    expect(() => {
      Bugs.onFiling(() => undefined)();
    }).not.toThrow();
  });

  it('has no update to offer, and nothing to install', async () => {
    expect(await Updates.state()).toEqual({ phase: 'idle', isRequired: false });
    expect(() => {
      Updates.install();
    }).not.toThrow();
    expect(Updates.onChange(() => undefined)).toBeTypeOf('function');
  });

  it('keeps no memory without a bridge', async () => {
    expect(
      await Memories.keep({
        projectId: 'p1',
        agentId: 'claude-code',
        model: '',
        language: 'pt',
        memories: [],
        events: [],
      }),
    ).toEqual({ isKept: false });
  });

  it('shows a project by its platform when no icon of its site can be asked for', async () => {
    expect(await Sites.icon('https://staging.loja.test/')).toBeNull();
  });
});
