import type { IOutsidePort } from '@/modules/Outside/types';
import type { ITestCase } from '@/modules/Plan';
import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import type {
  AppToolCall,
  CodeRead,
  INetworkEntry,
  OutsideToolCall,
} from '@/shared/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { performOutsideTool } from '@/modules/Outside/library';
import { startRun } from '@/modules/Workspace/library';
import {
  makeOutcome,
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { landAsked } from '@/modules/Workspace/library/landAsked';
import { landStep } from '@/modules/Workspace/library/landStep';

const PROJECT = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

const NOW = QUESTION.askedAtMs;
const DRAFT = {
  title: 'Coupon',
  priority: 'P1' as const,
  goal: '',
  preconditions: '',
  steps: [{ action: 'Apply the coupon', expected: 'The total drops' }],
};

/** Um app de mentira: o que ele guarda, e o que cada chamada pediu a ele. */
function appWith(props: {
  workspaces?: IWorkspace[];
  isLoaded?: boolean;
  network?: INetworkEntry[];
  startedId?: string | null;
  onWait?: () => IWorkspace[];
  slowPerform?: boolean;
  askingIds?: string[];
  onChat?: () => { workspaces: IWorkspace[]; askingIds: string[] };
  code?: CodeRead;
  isConfluenceOff?: boolean;
}) {
  let workspaces = props.workspaces ?? [makeWorkspace()];
  const started: unknown[] = [];
  const stopped: string[] = [];
  const paused: unknown[] = [];
  const answered: unknown[] = [];
  const took: unknown[] = [];
  const read: unknown[] = [];
  const published: unknown[] = [];
  const waited: number[] = [];
  const projects: IProject[] = [];
  const added: IWorkspace[] = [];
  const chatted: unknown[] = [];
  const performed: AppToolCall[] = [];
  const plans: { workspaceId: string; plan: ITestCase[] }[] = [];
  let askingIds = props.askingIds ?? [];
  const port: IOutsidePort = {
    read: () => ({
      isLoaded: props.isLoaded ?? true,
      projects: [PROJECT],
      workspaces,
      askingIds,
      variables: {
        p1: [{ name: 'ADMIN_PASSWORD', description: 'The admin password' }],
      },
      settings: {
        theme: 'dark',
        shownTheme: 'dark',
        language: 'pt',
        runAlert: 'system',
        agent: 'Claude Code',
        integrations: [
          {
            id: 'jira',
            account: 'ana@shop.test',
            site: 'https://shop.atlassian.net',
            connectedAt: '2026-11-01',
            confluence: props.isConfluenceOff !== true,
          },
        ],
      },
    }),
    now: () => NOW,
    targetLabel: (kind) => kind,
    putProject: (project) => {
      projects.push(project);
    },
    addWorkspace: (workspace) => {
      added.push(workspace);
    },
    startRun: (run) => {
      started.push(run);

      return props.startedId === undefined ? 'r-09' : props.startedId;
    },
    stopWorkspace: (id) => {
      stopped.push(id);
    },
    waitForRun: ({ ms }) => {
      waited.push(ms);

      if (props.onWait !== undefined) workspaces = props.onWait();

      return Promise.resolve();
    },
    networkOf: () => Promise.resolve(props.network ?? null),
    askChat: (message) => {
      chatted.push(message);
      askingIds = [...askingIds, message.workspaceId];
    },
    waitForChat: () => {
      if (props.onChat !== undefined) ({ workspaces, askingIds } = props.onChat());

      return Promise.resolve();
    },
    perform: (one) => {
      performed.push(one);

      return props.slowPerform === true
        ? new Promise(() => undefined)
        : Promise.resolve({ text: `did ${one.name}`, isError: false });
    },
    changePlan: (change) => {
      plans.push(change);
      workspaces = workspaces.map((one) =>
        one.id === change.workspaceId ? { ...one, plan: change.plan } : one,
      );
    },
    setPaused: (pause) => {
      paused.push(pause);
    },
    answerRun: (answer) => {
      answered.push(answer);
    },
    takeSuggestion: (take) => {
      took.push(take);
    },
    readCode: (request) => {
      read.push(request);

      return Promise.resolve(props.code ?? { kind: 'nothing', missing: [] });
    },
    listSpaces: () =>
      Promise.resolve({
        isListed: true,
        spaces: [{ id: 's-1', key: 'QA', name: 'Quality' }],
      }),
    publishPlan: (where) => {
      published.push(where);

      return Promise.resolve({
        isPublished: true,
        page: {
          id: 'pg-1',
          title: where.title,
          space: 'QA',
          url: 'https://shop.atlassian.net/pg-1',
        },
      });
    },
    publishTitle: (name) => `Test plan · ${name}`,
  };

  return {
    port,
    started,
    stopped,
    paused,
    answered,
    took,
    read,
    published,
    waited,
    projects,
    added,
    chatted,
    performed,
    plans,
  };
}

const call = (one: OutsideToolCall, app: ReturnType<typeof appWith>) =>
  performOutsideTool({ call: one, port: app.port });

const going = () =>
  startRun({
    workspace: makeWorkspace(),
    startedAt: '10:00',
    runId: 'r-01',
    by: WALKED_BY,
  });

describe('performOutsideTool', () => {
  it('asks to call again while the app is still reading what it keeps', async () => {
    const done = await call(
      { name: 'list_workspaces', args: {} },
      appWith({ isLoaded: false }),
    );

    expect(done).toEqual({
      text: 'QAzinho is still opening. Call this again in a moment.',
      isError: true,
    });
  });

  it('lists the workspaces under their projects, with what each tests', async () => {
    const done = await call({ name: 'list_workspaces', args: {} }, appWith({}));

    expect(done.text).toContain('Project p1 "Loja":');
    expect(done.text).toContain(
      'w1 "Checkout regression" · web https://shop.test · 2 cases and 6 steps · never run · 0 open bugs',
    );
  });

  it('says which workspaces it has when the one named is not there', async () => {
    const done = await call(
      { name: 'start_run', args: { workspace: 'nope' } },
      appWith({}),
    );

    expect(done.isError).toBe(true);
    expect(done.text).toContain('Checkout regression');
  });

  describe('start_run', () => {
    it('walks recorded cases without AI by default, and says how to read the run', async () => {
      const app = appWith({});
      const done = await call({ name: 'start_run', args: { workspace: 'w1' } }, app);

      expect(app.started).toEqual([{ workspaceId: 'w1', mode: 'replay' }]);
      expect(done).toEqual({
        text: 'Started r-09 of w1 "Checkout regression": 2 cases, 6 steps. It goes on by itself: read it with run_status and waitSeconds.',
        isError: false,
      });
    });

    it('takes only the cases named, with the agent when asked', async () => {
      const app = appWith({});
      const done = await call(
        {
          name: 'start_run',
          args: { workspace: 'w1', cases: ['TC-02'], withAgent: true },
        },
        app,
      );

      expect(app.started).toEqual([
        { workspaceId: 'w1', mode: 'agent', caseIds: ['TC-02'] },
      ]);
      expect(done.text).toContain('1 case, 3 steps');
    });

    it('refuses a case the plan does not have, naming the ones it has', async () => {
      const app = appWith({});
      const done = await call(
        { name: 'start_run', args: { workspace: 'w1', cases: ['TC-99'] } },
        app,
      );

      expect(app.started).toEqual([]);
      expect(done.text).toBe('w1 has no case TC-99. Its cases are TC-01, TC-02.');
    });

    it('does NOT start a second run over one that goes', async () => {
      const app = appWith({ workspaces: [going()] });
      const done = await call({ name: 'start_run', args: { workspace: 'w1' } }, app);

      expect(app.started).toEqual([]);
      expect(done).toMatchObject({ isError: true });
      expect(done.text).toContain('already running r-01');
    });

    it('points to the plan when there is none', async () => {
      const app = appWith({ workspaces: [makeWorkspace([])] });
      const done = await call({ name: 'start_run', args: { workspace: 'w1' } }, app);

      expect(app.started).toEqual([]);
      expect(done.text).toContain('add_cases');
      expect(done.text).toContain('ask_workspace_chat');
    });

    it('says so when the app could not start it', async () => {
      const done = await call(
        { name: 'start_run', args: { workspace: 'w1' } },
        appWith({ startedId: null }),
      );

      expect(done.isError).toBe(true);
    });
  });

  describe('run_status', () => {
    it('says how far a run got, and what it is on', async () => {
      const workspace = going();
      const walked = landStep({
        workspace,
        outcome: makeOutcome({ workspace, index: 0, verdict: 'passed' }),
        at: '10:01',
      });
      const done = await call(
        { name: 'run_status', args: { workspace: 'w1' } },
        appWith({ workspaces: [walked] }),
      );

      expect(done.text).toBe(
        'Run r-01 of w1 "Checkout regression" is still going on: 1 of 6 steps walked, 1 passed, 0 failed.\nNow on: Search for a product',
      );
    });

    /** A pergunta precisa chegar ao QA: quem está com ele agora é o agente de fora. */
    it('tells the agent to send the QA to a question the run waits on', async () => {
      const done = await call(
        { name: 'run_status', args: { workspace: 'w1' } },
        appWith({ workspaces: [landAsked({ workspace: going(), question: QUESTION })] }),
      );

      expect(done.text).toContain(
        'Its agent waits for the QA: "Which plan should I pick?" (Premium, Premium+). Tell them: they answer in QAzinho, and it holds for at most 15 more minutes.',
      );
    });

    it('holds for the seconds asked, then reads the run again', async () => {
      const app = appWith({
        workspaces: [going()],
        onWait: () => [walkRun({ verdicts: ['passed'], isFinished: true })],
      });
      const done = await call(
        { name: 'run_status', args: { workspace: 'w1', waitSeconds: 30 } },
        app,
      );

      expect(app.waited).toEqual([30_000]);
      expect(done.text).toContain('Run r-01 of w1');
      expect(done.text).not.toContain('still going on');
    });

    it('gives a finished run with the files of what went wrong and the calls that failed', async () => {
      const workspace = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
      const done = await call(
        { name: 'run_status', args: { workspace: 'w1' } },
        appWith({
          workspaces: [workspace],
          network: [
            {
              id: 1,
              method: 'POST',
              url: 'https://shop.test/api/pay',
              type: 'fetch',
              status: 500,
              failure: null,
              startedAt: 0,
              durationMs: 5,
              size: 5,
              body: 'boom',
            },
          ],
        }),
      );

      expect(done.text).toContain(
        'Screenshots of what went wrong, as files you can read:',
      );
      expect(done.text).toContain('/tmp/qazinho/step-2.jpg');
      expect(done.text).toContain('POST https://shop.test/api/pay → 500: boom');
    });

    it('has no run to read in a workspace that never ran', async () => {
      const done = await call(
        { name: 'run_status', args: { workspace: 'w1' } },
        appWith({}),
      );

      expect(done.text).toContain('has no runs yet');
    });
  });

  describe('stop_run', () => {
    it('stops the run that goes', async () => {
      const app = appWith({ workspaces: [going()] });

      await call({ name: 'stop_run', args: { workspace: 'w1' } }, app);

      expect(app.stopped).toEqual(['w1']);
    });

    /** O `endRun` não guarda uma run sem passo: o agente leria "no runs yet" sem entender. */
    it('says a run stopped before its first step leaves nothing behind', async () => {
      const app = appWith({ workspaces: [going()] });
      const done = await call({ name: 'stop_run', args: { workspace: 'w1' } }, app);

      expect(done.text).toContain('leaves no run behind');
    });

    it('has nothing to stop in a workspace at rest', async () => {
      const app = appWith({});
      const done = await call({ name: 'stop_run', args: { workspace: 'w1' } }, app);

      expect(app.stopped).toEqual([]);
      expect(done.isError).toBe(false);
    });
  });

  it('reads a bug with the files of its screenshots', async () => {
    const workspace = {
      ...makeWorkspace(),
      bugs: walkRun({ verdicts: ['failed'], isFinished: true }).bugs,
    };
    const [bug] = workspace.bugs;

    const done = await call(
      { name: 'bug_details', args: { workspace: 'w1', bug: bug?.id ?? '' } },
      appWith({
        workspaces: [
          {
            ...workspace,
            bugs: workspace.bugs.map((one) => ({
              ...one,
              shots: [{ isBad: true, src: null, file: '/runs/r-01/step-1.jpg' }],
            })),
          },
        ],
      }),
    );

    expect(done.text).toContain('Its screenshots, as files you can read:');
    expect(done.text).toContain('/runs/r-01/step-1.jpg');
  });

  describe('what the QA does on a run by hand', () => {
    it('pauses a run that goes, and resumes a paused one', async () => {
      const app = appWith({ workspaces: [going()] });

      expect(
        (await call({ name: 'pause_run', args: { workspace: 'w1' } }, app)).text,
      ).toContain('Paused r-01');
      expect(app.paused).toEqual([{ workspaceId: 'w1', isPaused: true }]);

      const stopped = appWith({
        workspaces: [{ ...going(), live: { ...going().live!, isRunning: false } }],
      });

      await call({ name: 'resume_run', args: { workspace: 'w1' } }, stopped);

      expect(stopped.paused).toEqual([{ workspaceId: 'w1', isPaused: false }]);
    });

    it('does NOT pause what is already paused, nor a workspace with no run', async () => {
      const paused = appWith({
        workspaces: [{ ...going(), live: { ...going().live!, isRunning: false } }],
      });

      expect(
        (await call({ name: 'pause_run', args: { workspace: 'w1' } }, paused)).text,
      ).toContain('already paused');
      expect(paused.paused).toEqual([]);

      const idle = appWith({});

      expect(
        await call({ name: 'pause_run', args: { workspace: 'w1' } }, idle),
      ).toMatchObject({ isError: true });
    });

    it("answers the run's question with the option it offers, in its own words", async () => {
      const app = appWith({
        workspaces: [
          {
            ...going(),
            live: { ...going().live!, question: { ...QUESTION, waitedSec: 3 } },
          },
        ],
      });
      const done = await call(
        { name: 'answer_run_question', args: { workspace: 'w1', answer: 'premium+' } },
        app,
      );

      expect(done.isError).toBe(false);
      expect(app.answered).toEqual([
        { workspaceId: 'w1', questionId: 'q-1', text: 'Premium+' },
      ]);
    });

    it('does NOT answer a secret, which the QA types in QAzinho', async () => {
      const app = appWith({
        workspaces: [
          {
            ...going(),
            live: {
              ...going().live!,
              question: { ...QUESTION, isSecret: true, waitedSec: 3 },
            },
          },
        ],
      });
      const done = await call(
        { name: 'answer_run_question', args: { workspace: 'w1', answer: '123456' } },
        app,
      );

      expect(done).toMatchObject({ isError: true });
      expect(done.text).toContain('types it in QAzinho');
      expect(app.answered).toEqual([]);
    });

    it('says when the run waits on no question', async () => {
      const app = appWith({ workspaces: [going()] });

      expect(
        await call(
          { name: 'answer_run_question', args: { workspace: 'w1', answer: 'x' } },
          app,
        ),
      ).toMatchObject({ isError: true });
    });
  });

  describe("taking an exploration's suggestion", () => {
    const suggesting = (isTaken = false) =>
      appWith({
        workspaces: [
          {
            ...makeWorkspace(),
            chat: [
              {
                id: 'm-3',
                kind: 'suggestion' as const,
                at: '10:00',
                runId: 'r-02',
                summary: 'What the exploration saw',
                cases: [
                  DRAFT,
                  { ...DRAFT, title: 'Second' },
                  { ...DRAFT, title: 'Third' },
                ],
                isTaken,
              },
            ],
          },
        ],
      });

    it('takes every case, or the ones named by their number from 1', async () => {
      const every = suggesting();

      await call({ name: 'take_suggestion', args: { workspace: 'w1' } }, every);

      expect(every.took).toEqual([{ workspaceId: 'w1', messageId: 'm-3' }]);

      const some = suggesting();

      await call(
        { name: 'take_suggestion', args: { workspace: 'w1', cases: [1, 3] } },
        some,
      );

      expect(some.took).toEqual([{ workspaceId: 'w1', messageId: 'm-3', only: [0, 2] }]);
    });

    it('does NOT take a case number the card does not have', async () => {
      const app = suggesting();
      const done = await call(
        { name: 'take_suggestion', args: { workspace: 'w1', cases: [4] } },
        app,
      );

      expect(done).toMatchObject({ isError: true });
      expect(app.took).toEqual([]);
    });

    it('says there is nothing to take once the QA took it', async () => {
      expect(
        await call(
          { name: 'take_suggestion', args: { workspace: 'w1' } },
          suggesting(true),
        ),
      ).toMatchObject({ isError: true });
    });
  });

  it("hands linking, unlinking and building to the assistant's own tools", async () => {
    const app = appWith({});

    const calls: OutsideToolCall[] = [
      { name: 'list_repositories', args: {} },
      { name: 'link_repository', args: { project: 'Loja', repository: 'acme/shop' } },
      { name: 'unlink_design', args: { workspace: 'w1' } },
      { name: 'build_app', args: { project: 'Loja', platform: 'android' } },
      { name: 'build_status', args: {} },
    ];

    for (const one of calls) expect((await call(one, app)).text).toBe(`did ${one.name}`);

    expect(app.performed.map(({ name }) => name)).toEqual([
      'list_repositories',
      'link_repository',
      'unlink_design',
      'build_app',
      'build_status',
    ]);
  });

  describe('exporting the recorded cases as code', () => {
    it('hands the code as text, with the cases it leaves out', async () => {
      const app = appWith({
        code: {
          kind: 'code',
          files: [{ name: 'qazinho.spec.ts', content: 'test("TC-01", async () => {});' }],
          samples: [],
          exported: ['TC-01'],
          missing: ['TC-02'],
        },
      });
      const done = await call({ name: 'export_code', args: { workspace: 'w1' } }, app);

      expect(done.isError).toBe(false);
      expect(done.text).toContain('=== qazinho.spec.ts ===');
      expect(done.text).toContain('test("TC-01"');
      expect(done.text).toContain('TC-02 have no recording yet');
      expect(app.read).toEqual([
        expect.objectContaining({
          workspaceId: 'w1',
          viewport: { width: 1280, height: 800 },
        }),
      ]);
    });

    it('says to run the plan first when nothing was recorded', async () => {
      const done = await call(
        { name: 'export_code', args: { workspace: 'w1' } },
        appWith({}),
      );

      expect(done).toMatchObject({ isError: true });
      expect(done.text).toContain('start_run');
    });
  });

  describe('publishing the plan to Confluence', () => {
    it('asks for the space the first time, naming the ones there are', async () => {
      const app = appWith({});
      const done = await call({ name: 'publish_plan', args: { workspace: 'w1' } }, app);

      expect(done).toMatchObject({ isError: true });
      expect(done.text).toContain('QA "Quality"');
      expect(app.published).toEqual([]);
    });

    it('publishes in the space named by its key, titled after the workspace', async () => {
      const app = appWith({});
      const done = await call(
        { name: 'publish_plan', args: { workspace: 'w1', space: 'qa' } },
        app,
      );

      expect(done.isError).toBe(false);
      expect(app.published).toEqual([
        {
          workspaceId: 'w1',
          pageId: null,
          spaceId: 's-1',
          parentId: null,
          title: `Test plan · ${makeWorkspace().name}`,
        },
      ]);
    });

    it('writes the next version of a page already published, with no space asked', async () => {
      const app = appWith({
        workspaces: [
          {
            ...makeWorkspace(),
            published: {
              page: { id: 'pg-7', title: 'Plano', space: 'QA', url: 'https://x/pg-7' },
              spaceId: 's-1',
              parentId: 'pg-2',
            },
          },
        ],
      });

      await call({ name: 'publish_plan', args: { workspace: 'w1' } }, app);

      expect(app.published).toEqual([
        {
          workspaceId: 'w1',
          pageId: 'pg-7',
          spaceId: 's-1',
          parentId: 'pg-2',
          title: 'Plano',
        },
      ]);
    });

    it('does NOT publish while Confluence is off', async () => {
      const app = appWith({ isConfluenceOff: true });
      const done = await call(
        { name: 'publish_plan', args: { workspace: 'w1', space: 'QA' } },
        app,
      );

      expect(done).toMatchObject({ isError: true });
      expect(app.published).toEqual([]);
    });
  });

  describe('creating what an app QAzinho does not know yet needs', () => {
    // Um agente num app sem projeto não tinha o que rodar nem como criar; agora ele cria.
    it('creates a project on a web address, and says to make a workspace next', async () => {
      const app = appWith({});

      const done = await call(
        {
          name: 'create_project',
          args: { name: 'Painel', web: 'http://localhost:3000' },
        },
        app,
      );

      expect(done.isError).toBe(false);
      expect(done.text).toContain('create_workspace');
      expect(app.projects).toEqual([
        expect.objectContaining({
          name: 'Painel',
          targets: [
            {
              id: 't-web',
              kind: 'web',
              label: 'web',
              value: 'http://localhost:3000',
            },
          ],
          repositories: [],
        }),
      ]);
    });

    it('does NOT create a project with no target, or with an address that is not one', async () => {
      const app = appWith({});

      expect(
        (await call({ name: 'create_project', args: { name: 'Painel' } }, app)).isError,
      ).toBe(true);
      expect(
        (
          await call(
            { name: 'create_project', args: { name: 'Painel', web: 'not a url' } },
            app,
          )
        ).isError,
      ).toBe(true);
      expect(app.projects).toEqual([]);
    });

    it('creates a workspace with an empty plan, and says how its first cases come', async () => {
      const app = appWith({});

      const done = await call(
        { name: 'create_workspace', args: { project: 'Loja', name: 'Checkout' } },
        app,
      );

      expect(done.isError).toBe(false);
      expect(done.text).toContain('add_cases');
      expect(app.added).toEqual([
        expect.objectContaining({
          projectId: 'p1',
          name: 'Checkout',
          targetId: 't1',
          plan: [],
        }),
      ]);
    });

    it('refuses a workspace on a target the project does not have', async () => {
      const app = appWith({});

      const done = await call(
        {
          name: 'create_workspace',
          args: { project: 'Loja', name: 'Checkout', target: 'android' },
        },
        app,
      );

      expect(done).toEqual({
        text: 'p1 has no android target. Its targets are web.',
        isError: true,
      });
      expect(app.added).toEqual([]);
    });
  });

  describe("talking with a workspace's own agent", () => {
    it('writes in the chat, and reads back what the agent answered and asks', async () => {
      const answered: IWorkspace = {
        ...makeWorkspace(),
        chat: [
          {
            id: 'm-1',
            kind: 'user',
            at: '10:00',
            text: 'Plan the checkout',
            from: 'agent',
          },
          {
            id: 'm-2',
            kind: 'agent',
            at: '10:01',
            who: 'Claude Code',
            text: 'Which cards?',
          },
          {
            id: 'm-3',
            kind: 'questions',
            at: '10:01',
            answers: null,
            questions: [
              {
                header: 'Cards',
                question: 'Which cards does it take?',
                options: [
                  { label: 'Visa', description: '' },
                  { label: 'All', description: '' },
                ],
                isMultiSelect: false,
              },
            ],
          },
        ],
      };
      const app = appWith({
        onChat: () => ({ workspaces: [answered], askingIds: [] }),
      });

      const done = await call(
        {
          name: 'ask_workspace_chat',
          args: { workspace: 'w1', text: 'Plan the checkout', waitSeconds: 30 },
        },
        app,
      );

      expect(app.chatted).toEqual([{ workspaceId: 'w1', text: 'Plan the checkout' }]);
      expect(done.text).toContain('It answered: Which cards?');
      expect(done.text).toContain('1. Which cards does it take? Options: Visa · All.');
    });

    it('says the agent still works when the wait ends first', async () => {
      const app = appWith({});

      const done = await call(
        { name: 'ask_workspace_chat', args: { workspace: 'w1', text: 'Plan it' } },
        app,
      );

      expect(done.text).toContain('still working on it');
    });

    it('does NOT write while the agent is still answering', async () => {
      const app = appWith({ askingIds: ['w1'] });

      const done = await call(
        { name: 'ask_workspace_chat', args: { workspace: 'w1', text: 'More' } },
        app,
      );

      expect(done.isError).toBe(true);
      expect(app.chatted).toEqual([]);
    });
  });

  // O agente de fora pergunta ao usuário no chat dele antes de chamar: aqui a mudança é feita.
  describe('changing what the QA keeps', () => {
    const CASE = {
      title: 'Coupon',
      priority: 'P1' as const,
      goal: 'A coupon takes 10% off.',
      preconditions: 'One product in the cart.',
      steps: [
        { action: 'Type SAVE10 in the coupon field', expected: 'The total drops 10%' },
      ],
    };

    it('adds new cases to the plan, after the ones it has', async () => {
      const app = appWith({});

      const done = await call(
        { name: 'add_cases', args: { workspace: 'w1', cases: [CASE] } },
        app,
      );

      expect(done.isError).toBe(false);
      expect(app.plans[0]?.plan.map(({ id }) => id)).toEqual(['TC-01', 'TC-02', 'TC-03']);
      expect(done.text).toContain('Added TC-03 "Coupon"');
    });

    it('does NOT add a case under the id of one the plan has', async () => {
      const app = appWith({});

      const done = await call(
        {
          name: 'add_cases',
          args: { workspace: 'w1', cases: [{ ...CASE, id: 'TC-01' }] },
        },
        app,
      );

      expect(done.isError).toBe(true);
      expect(done.text).toContain('update_cases');
      expect(app.plans).toEqual([]);
    });

    it('rewrites a case in its place', async () => {
      const app = appWith({});

      const done = await call(
        {
          name: 'update_cases',
          args: { workspace: 'w1', cases: [{ ...CASE, id: 'TC-02' }] },
        },
        app,
      );

      expect(app.plans[0]?.plan.map(({ id, title }) => `${id} ${title}`)).toEqual([
        'TC-01 Open the store and find a product',
        'TC-02 Coupon',
      ]);
      expect(done.text).toContain('Changed TC-02 "Coupon"');
    });

    it('refuses to rewrite a case the plan lacks, or one with no id', async () => {
      const app = appWith({});

      const unknown = await call(
        {
          name: 'update_cases',
          args: { workspace: 'w1', cases: [{ ...CASE, id: 'TC-09' }] },
        },
        app,
      );
      const bare = await call(
        { name: 'update_cases', args: { workspace: 'w1', cases: [CASE] } },
        app,
      );

      expect(unknown).toMatchObject({
        isError: true,
        text: expect.stringContaining('TC-09') as string,
      });
      expect(bare).toMatchObject({
        isError: true,
        text: expect.stringContaining('has no id') as string,
      });
      expect(app.plans).toEqual([]);
    });

    it('deletes cases, and refuses one the plan lacks', async () => {
      const app = appWith({});

      const gone = await call(
        { name: 'delete_cases', args: { workspace: 'w1', cases: ['tc-01'] } },
        app,
      );
      const unknown = await call(
        { name: 'delete_cases', args: { workspace: 'w1', cases: ['TC-09'] } },
        app,
      );

      expect(app.plans[0]?.plan.map(({ id }) => id)).toEqual(['TC-02']);
      expect(gone.text).toContain('Deleted TC-01');
      expect(unknown.isError).toBe(true);
      expect(app.plans).toHaveLength(1);
    });

    it('does NOT change the plan while a run walks it', async () => {
      const app = appWith({ workspaces: [going()] });

      const done = await call(
        { name: 'add_cases', args: { workspace: 'w1', cases: [CASE] } },
        app,
      );

      expect(done.isError).toBe(true);
      expect(app.plans).toEqual([]);
    });

    it('asks for something to change in a project before touching it', async () => {
      const app = appWith({});

      const done = await call({ name: 'update_project', args: { project: 'Loja' } }, app);

      expect(done.isError).toBe(true);
      expect(app.performed).toEqual([]);
    });

    it('hands project, workspace, exploring and bug changes to the same paths as the Intern', async () => {
      const app = appWith({});
      const changes: OutsideToolCall[] = [
        {
          name: 'update_project',
          args: { project: 'Loja', web: 'https://staging.shop.test' },
        },
        { name: 'rename_workspace', args: { workspace: 'w1', name: 'Payments' } },
        { name: 'explore_app', args: { workspace: 'w1' } },
        { name: 'dismiss_bug', args: { workspace: 'w1', bug: 'BUG-01' } },
        { name: 'send_bug', args: { workspace: 'w1', bug: 'BUG-01' } },
        { name: 'delete_workspace', args: { workspace: 'w1' } },
        { name: 'delete_project', args: { project: 'Loja' } },
      ];

      for (const change of changes) await call(change, app);

      expect(app.performed).toEqual(changes);
    });
  });

  describe('variables, settings and integrations', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("lists a project's variables by name and description, never a value", async () => {
      const done = await call(
        { name: 'list_variables', args: { project: 'Loja' } },
        appWith({}),
      );

      expect(done.text).toContain('${ADMIN_PASSWORD} · The admin password');
    });

    it('reads the settings and who each integration is connected as', async () => {
      const done = await call({ name: 'read_settings', args: {} }, appWith({}));

      expect(done.text).toContain('Theme: night (dark).');
      expect(done.text).toContain('Language: Brazilian Portuguese.');
      expect(done.text).toContain('GitHub: not connected.');
      expect(done.text).toContain(
        'Jira: connected as ana@shop.test on https://shop.atlassian.net, Confluence on.',
      );
    });

    it('hands variable, settings and integration changes to the same paths as the Intern', async () => {
      const app = appWith({});
      const changes: OutsideToolCall[] = [
        {
          name: 'update_variable',
          args: { project: 'Loja', variable: 'ADMIN_PASSWORD', description: 'Admin' },
        },
        {
          name: 'delete_variable',
          args: { project: 'Loja', variable: 'ADMIN_PASSWORD' },
        },
        { name: 'change_settings', args: { theme: 'paper', language: 'en' } },
        { name: 'connect_integration', args: { integration: 'github' } },
        { name: 'disconnect_integration', args: { integration: 'jira' } },
      ];

      for (const change of changes) await call(change, app);

      expect(app.performed).toEqual(changes);
    });

    // A janela de valores espera o usuário por minutos; um cliente de MCP desiste em 60 s.
    it('says the window of values still waits when the user has not saved it in time', async () => {
      vi.useFakeTimers();
      const app = appWith({ slowPerform: true });

      const answer = call(
        {
          name: 'ask_variables',
          args: {
            project: 'Loja',
            variables: [{ name: 'TOKEN', description: 'API token' }],
          },
        },
        app,
      );

      await vi.advanceTimersByTimeAsync(45_000);

      await expect(answer).resolves.toMatchObject({
        text: expect.stringContaining('still waits on them') as string,
      });
    });
  });
});
