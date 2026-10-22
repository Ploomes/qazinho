import type { IAttachSuite, ISuiteTestsCall } from '@/harness';
import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type {
  IAgentTurn,
  ISuiteChange,
  ISuiteResult,
  SuiteChangeEvent,
} from '@/shared/types';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { GitCli } from '@/main/classes/automation/GitCli';
import { SuiteChanges } from '@/main/classes/automation/SuiteChanges';
import { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';

const KEY = {
  name: 'USER_KEY',
  description: 'The session cookie',
  value: 'k3y-of-the-qa-9',
};
const BROKEN = `import { test } from '@playwright/test';

test('CT-NAV-002 · Abre o carrinho', async ({ page }) => {
  await page.getByRole('link', { name: 'Meu carrinho' }).click();
});
`;
const FIXED = BROKEN.replace("'Meu carrinho'", "'Carrinho'");

const git = (props: { cwd: string; args: string[] }) =>
  execFileSync('git', props.args, { cwd: props.cwd, encoding: 'utf8' }).trim();

const result = (props: Partial<ISuiteResult>): ISuiteResult => ({
  testId: 't-2',
  title: 'CT-NAV-002 · Abre o carrinho',
  file: 'tests/hc-1/ct-nav.spec.ts',
  line: 3,
  project: 'chromium',
  status: 'passed',
  isFlaky: false,
  durationMs: 1_100,
  error: null,
  attachments: [],
  ...props,
});

/** The team's suite as a git repository of its own, with its Playwright installed and a bare remote to push to. */
async function teamSuite() {
  const folder = await realpath(await mkdtemp(join(tmpdir(), 'qazinho-changes-')));
  const repo = join(folder, 'e2e');
  const remote = join(folder, 'remote.git');

  await mkdir(join(repo, 'tests', 'hc-1'), { recursive: true });
  await mkdir(join(repo, 'node_modules', '@playwright', 'test'), { recursive: true });
  await writeFile(join(repo, 'playwright.config.ts'), 'export default {};\n');
  await writeFile(join(repo, 'tests', 'hc-1', 'ct-nav.spec.ts'), BROKEN);
  await writeFile(join(repo, '.gitignore'), 'node_modules/\n.env\n');
  await writeFile(join(repo, '.env'), `USER_KEY=${KEY.value}\n`);
  await writeFile(
    join(repo, 'node_modules', '@playwright', 'test', 'package.json'),
    '{"version":"1.63.0"}',
  );
  git({ cwd: folder, args: ['init', '--bare', '--quiet', remote] });
  git({ cwd: repo, args: ['init', '--quiet', '-b', 'main'] });
  git({ cwd: repo, args: ['config', 'user.name', 'QA'] });
  git({ cwd: repo, args: ['config', 'user.email', 'qa@acme.test'] });
  git({ cwd: repo, args: ['add', '-A'] });
  git({ cwd: repo, args: ['commit', '--quiet', '-m', 'feat(hc-1): open the cart'] });
  git({ cwd: repo, args: ['remote', 'add', 'origin', remote] });

  return { folder, repo, remote };
}

/**
 * Changes over the team's suite. git is the real one, on folders of the test's own; the agent
 * is a function of its copy of the suite, the tests it runs answer what the test says, and gh
 * only remembers what it was asked to open.
 */
async function changesWith(props: {
  agent: (call: { run: IRunAgent; suite: IAttachSuite | null }) => Promise<IAgentTurn>;
  checked?: ISuiteResult[];
  path?: string;
}) {
  const team = await teamSuite();
  const root = join(team.folder, 'suites');
  const directories = (process.env.PATH ?? '').split(':');
  const cli = new GitCli({ directories: async () => directories });
  const registry = new SuiteRegistry({ root, git: cli });
  const events: SuiteChangeEvent[] = [];
  const checks: {
    path: string;
    project: string;
    filters: string[];
    grep: string | null;
  }[] = [];
  const pulls: { path: string; fields?: Record<string, string> }[] = [];
  let suite: IAttachSuite | null = null;

  await registry.connect({ projectId: 'p', path: props.path ?? team.repo });

  const changes = new SuiteChanges({
    registry: {
      pathOf: (projectId) => registry.pathOf(projectId),
      runnerOf: (path) => registry.runnerOf(path),
      suiteOf: async (projectId) => {
        const read = await registry.suiteOf(projectId);

        return read === null ? null : { ...read, repository: 'acme/e2e' };
      },
    },
    suites: {
      check: async (check) => {
        checks.push(check);

        return { results: props.checked ?? [result({})], failure: null, said: '' };
      },
      stopCheck: () => undefined,
      resultOf: async () => ({
        result: result({
          status: 'failed',
          error: `TimeoutError: waiting for getByRole('link', { name: 'Meu carrinho' })`,
        }),
        folder: join(root, 'p', 'runs', 's-03'),
      }),
    },
    git: cli,
    github: {
      api: async (call) => {
        pulls.push(call);

        return { isOk: true, text: 'https://github.com/acme/e2e/pull/7\n' };
      },
    },
    runner: {
      ask: (run) => props.agent({ run, suite }),
      cancel: () => undefined,
    },
    harness: new Harness(),
    tools: {
      attachSuite: (attached) => {
        suite = attached;
      },
      detachSuite: () => {
        suite = null;
      },
      mcpConfigFor: () => '{"mcpServers":{}}',
    },
    findCommand: async () => '/bin/claude',
    values: async () => [KEY],
    path: async () => process.env.PATH ?? '',
    root,
    onEvent: (event) => events.push(event),
    now: () => 1_000,
  });

  return { team, changes, events, checks, pulls };
}

const answered = (answer: {
  outcome: 'changed' | 'app-bug' | 'gave-up';
  summary?: string;
  commit?: string;
  title?: string;
  body?: string;
}): IAgentTurn => ({
  sessionId: null,
  text: JSON.stringify({ summary: '', commit: '', title: '', body: '', ...answer }),
  usage: null,
  isError: false,
  costUsd: 0.1,
});

/** The agent fixes the test in its copy, the way a real one would with Edit, then answers. */
const fixes = async ({ run }: { run: IRunAgent }) => {
  await writeFile(join(run.writeDir ?? '', 'tests', 'hc-1', 'ct-nav.spec.ts'), FIXED);

  return answered({
    outcome: 'changed',
    summary: 'The menu link is "Carrinho" now.',
    commit: 'fix(hc-1): find the cart by its new name',
    title: 'CT-NAV-002: find the cart by its new name',
    body: 'The menu link was renamed.',
  });
};

const START = {
  projectId: 'p',
  changeId: 'c-01',
  agentId: 'claude-code',
  model: '',
  language: 'pt' as const,
  projects: ['chromium'],
  ask: {
    kind: 'fix' as const,
    runId: 's-03',
    test: {
      id: 't-2',
      file: 'tests/hc-1/ct-nav.spec.ts',
      line: 3,
      path: [],
      title: 'CT-NAV-002 · Abre o carrinho',
      tags: [],
      project: 'chromium',
    },
  },
};

describe('SuiteChanges', () => {
  describe('start', () => {
    it('fixes the test on a branch of its own, and keeps the diff and its own run of the test', async () => {
      const { team, changes, checks } = await changesWith({ agent: fixes });
      const change = await changes.start(START);

      expect(change).toMatchObject({
        status: 'ready',
        step: null,
        branch: 'qazinho/fix-ct-nav-002-abre-o-carrinho',
        base: 'main',
        summary: 'The menu link is "Carrinho" now.',
        check: { status: 'passed' },
        failure: null,
      });
      expect(change.files).toEqual([
        expect.objectContaining({
          path: 'tests/hc-1/ct-nav.spec.ts',
          status: 'modified',
          additions: 1,
          deletions: 1,
        }),
      ]);
      expect(checks.at(-1)).toMatchObject({
        project: 'chromium',
        filters: ['tests/hc-1/ct-nav.spec.ts'],
        grep: 'CT-NAV-002 · Abre o carrinho',
      });
      expect(git({ cwd: team.repo, args: ['status', '--porcelain'] })).toBe('');
      expect(
        await readFile(join(team.repo, 'tests', 'hc-1', 'ct-nav.spec.ts'), 'utf8'),
      ).toBe(BROKEN);
    });

    /** The tests run through QAzinho, which knows the secrets; the agent edits and reads files, and has no shell. */
    it('hands the agent its copy, file tools and the test that broke, and no shell', async () => {
      const asked: IRunAgent[] = [];
      const { changes } = await changesWith({
        agent: async (call) => {
          asked.push(call.run);

          return fixes(call);
        },
      });

      await changes.start(START);

      const [run] = asked;

      expect(run).toMatchObject({
        workspaceId: '~change:c-01',
        tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write'],
        mcpConfig: '{"mcpServers":{}}',
      });
      expect(run?.allowedTools).toContain('mcp__qazinho');
      expect(run?.allowedTools?.some((tool) => tool.startsWith('Bash'))).toBe(false);
      expect(run?.prompt).toContain('CT-NAV-002 · Abre o carrinho');
      expect(run?.prompt).toContain('feat(hc-1): open the cart');
    });

    it('runs the tests the agent asks for in its copy, each secret read back as its name', async () => {
      let answer = '';
      const { checks, events } = await (async () => {
        const made = await changesWith({
          checked: [result({ status: 'failed', error: `got "${KEY.value}"` })],
          agent: async (call) => {
            answer =
              (
                await call.suite?.runTests({
                  tests: ['tests/hc-1/ct-nav.spec.ts:3'],
                  project: 'chromium',
                } satisfies ISuiteTestsCall)
              )?.text ?? '';

            return fixes(call);
          },
        });

        await made.changes.start(START);

        return made;
      })();

      expect(events).toContainEqual({
        kind: 'ran',
        projectId: 'p',
        changeId: 'c-01',
        total: 1,
        passed: 0,
      });
      expect(checks[0]?.path).toContain(join('changes', 'c-01', 'work'));
      expect(checks[0]?.filters).toEqual(['tests/hc-1/ct-nav.spec.ts:3']);
      expect(answer).toContain('got "${USER_KEY}"');
      expect(answer).not.toContain(KEY.value);
    });

    /** The copy holds links to the suite's packages and its .env, so its tests run; they are never part of the change. */
    it('links what the copy needs to run, and leaves the links out of the change', async () => {
      const { changes } = await changesWith({ agent: fixes });
      const change = await changes.start(START);

      expect(change.files.map(({ path }) => path)).toEqual(['tests/hc-1/ct-nav.spec.ts']);
    });

    /** Nothing changed, so nothing is left to review: the copy and its branch go at once. */
    it('says the app is wrong, changes nothing, and leaves no copy or branch behind', async () => {
      const { team, changes, checks } = await changesWith({
        agent: async () =>
          answered({ outcome: 'app-bug', summary: 'The cart link is missing.' }),
      });
      const change = await changes.start(START);

      expect(change).toMatchObject({
        status: 'app-bug',
        summary: 'The cart link is missing.',
        files: [],
      });
      expect(checks).toEqual([]);
      expect(git({ cwd: team.repo, args: ['branch', '--list', change.branch] })).toBe('');
      expect(
        git({ cwd: team.repo, args: ['worktree', 'list'] }).split('\n'),
      ).toHaveLength(1);
    });

    it('says the agent changed nothing when it said it did', async () => {
      const { changes } = await changesWith({
        agent: async () => answered({ outcome: 'changed' }),
      });

      expect(await changes.start(START)).toMatchObject({
        status: 'gave-up',
        failure: { reason: 'no-change' },
      });
    });

    it('refuses a folder git does not keep', async () => {
      const lone = await realpath(await mkdtemp(join(tmpdir(), 'qazinho-lone-')));

      await writeFile(join(lone, 'playwright.config.ts'), 'export default {};\n');

      const { changes } = await changesWith({ agent: fixes, path: lone });

      expect(await changes.start(START)).toMatchObject({
        status: 'broke',
        failure: { reason: 'no-git' },
      });
    });

    it('tells the page each step as it goes', async () => {
      const { changes, events } = await changesWith({ agent: fixes });

      await changes.start(START);

      expect(
        events
          .filter(
            (event): event is Extract<SuiteChangeEvent, { kind: 'changed' }> =>
              event.kind === 'changed',
          )
          .map(({ change }) => `${change.status}:${String(change.step)}`),
      ).toEqual([
        'working:copy',
        'working:copy',
        'working:agent',
        'working:check',
        'ready:null',
      ]);
    });
  });

  describe('ship', () => {
    it("commits with the agent's message, pushes the branch, opens the pull request and drops the copy", async () => {
      const { team, changes, pulls } = await changesWith({ agent: fixes });
      const ready = await changes.start(START);
      const sent = await changes.ship({
        projectId: 'p',
        changeId: 'c-01',
        way: 'pull-request',
      });

      expect(sent).toMatchObject({
        isOk: true,
        change: {
          status: 'shipped',
          shipped: { way: 'pull-request', url: 'https://github.com/acme/e2e/pull/7' },
        },
      });
      expect(
        git({ cwd: team.remote, args: ['log', '-1', '--format=%s', ready.branch] }),
      ).toBe('fix(hc-1): find the cart by its new name');
      expect(pulls).toEqual([
        expect.objectContaining({
          path: 'repos/acme/e2e/pulls',
          method: 'POST',
          fields: {
            title: 'CT-NAV-002: find the cart by its new name',
            head: ready.branch,
            base: 'main',
            body: 'The menu link was renamed.',
          },
        }),
      ]);
      expect(
        existsSync(join(team.folder, 'suites', 'p', 'changes', 'c-01', 'work')),
      ).toBe(false);
    });

    it('pushes the branch alone, with where to open the pull request', async () => {
      const { changes, pulls } = await changesWith({ agent: fixes });

      await changes.start(START);

      expect(
        await changes.ship({ projectId: 'p', changeId: 'c-01', way: 'branch' }),
      ).toMatchObject({
        isOk: true,
        change: {
          shipped: {
            way: 'branch',
            url: 'https://github.com/acme/e2e/compare/main...qazinho/fix-ct-nav-002-abre-o-carrinho?expand=1',
          },
        },
      });
      expect(pulls).toEqual([]);
    });

    it('does NOT send a change that is not ready', async () => {
      const { changes } = await changesWith({
        agent: async () => answered({ outcome: 'app-bug' }),
      });

      await changes.start(START);

      await expect(
        changes.ship({ projectId: 'p', changeId: 'c-01', way: 'branch' }),
      ).rejects.toThrow('not ready');
    });
  });

  describe('discard', () => {
    it('throws the copy and its branch away, and the QA clone stays as it was', async () => {
      const { team, changes } = await changesWith({ agent: fixes });
      const ready = await changes.start(START);
      const discarded = await changes.discard({ projectId: 'p', changeId: 'c-01' });

      expect(discarded?.status).toBe('discarded');
      expect(git({ cwd: team.repo, args: ['branch', '--list', ready.branch] })).toBe('');
      expect(
        git({ cwd: team.repo, args: ['worktree', 'list'] }).split('\n'),
      ).toHaveLength(1);
    });
  });

  describe('changes', () => {
    it('lists the changes the latest first, and one left working when QAzinho closed as broken', async () => {
      const { team, changes } = await changesWith({ agent: fixes });
      const left: Partial<ISuiteChange> = {
        id: 'c-00',
        projectId: 'p',
        startedAt: 1,
        status: 'working',
        step: 'agent',
        files: [],
        failure: null,
      };
      const folder = join(team.folder, 'suites', 'p', 'changes', 'c-00');

      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, 'change.json'), JSON.stringify(left));
      await changes.start(START);

      expect(
        (await changes.changes('p')).map(({ id, status, failure }) => ({
          id,
          status,
          failure,
        })),
      ).toEqual([
        { id: 'c-01', status: 'ready', failure: null },
        { id: 'c-00', status: 'broke', failure: { reason: 'closed' } },
      ]);
    });

    it('reads no change of a project out of its own folder', async () => {
      const { changes } = await changesWith({ agent: fixes });

      expect(await changes.changes('../..')).toEqual([]);
      await expect(
        changes.discard({ projectId: 'p', changeId: '../../x' }),
      ).rejects.toThrow('no such change');
    });
  });
});
