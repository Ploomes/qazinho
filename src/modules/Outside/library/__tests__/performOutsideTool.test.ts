import type { ConfirmDecision } from '@/modules/Assistant/types';
import type { IOutsidePort } from '@/modules/Outside/types';
import type { ITestCase } from '@/modules/Plan';
import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import type { AppToolCall, INetworkEntry, OutsideToolCall } from '@/shared/types';
import { describe, expect, it } from 'vitest';
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

/** Um app de mentira: o que ele guarda, e o que cada chamada pediu a ele. */
function appWith(props: {
  workspaces?: IWorkspace[];
  isLoaded?: boolean;
  network?: INetworkEntry[];
  startedId?: string | null;
  onWait?: () => IWorkspace[];
  askingIds?: string[];
  decision?: ConfirmDecision;
  onChat?: () => { workspaces: IWorkspace[]; askingIds: string[] };
}) {
  let workspaces = props.workspaces ?? [makeWorkspace()];
  const started: unknown[] = [];
  const stopped: string[] = [];
  const suggested: unknown[] = [];
  const waited: number[] = [];
  const projects: IProject[] = [];
  const added: IWorkspace[] = [];
  const chatted: unknown[] = [];
  const performed: AppToolCall[] = [];
  const asked: unknown[] = [];
  const plans: { workspaceId: string; plan: ITestCase[] }[] = [];
  let askingIds = props.askingIds ?? [];
  const port: IOutsidePort = {
    read: () => ({
      isLoaded: props.isLoaded ?? true,
      projects: [PROJECT],
      workspaces,
      askingIds,
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

      return Promise.resolve({ text: `did ${one.name}`, isError: false });
    },
    confirm: (ask) => {
      asked.push(ask);

      return Promise.resolve(props.decision ?? 'confirmed');
    },
    changePlan: (change) => {
      plans.push(change);
      workspaces = workspaces.map((one) =>
        one.id === change.workspaceId ? { ...one, plan: change.plan } : one,
      );
    },
    suggestCases: (suggestion) => {
      suggested.push(suggestion);
    },
  };

  return {
    port,
    started,
    stopped,
    suggested,
    waited,
    projects,
    added,
    chatted,
    performed,
    asked,
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
      expect(done.text).toContain('suggest_cases');
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

  it('leaves suggested cases waiting on the QA, and says so', async () => {
    const app = appWith({});
    const cases = [
      {
        title: 'Coupon',
        priority: 'P1' as const,
        goal: '',
        preconditions: '',
        steps: [],
      },
    ];
    const done = await call(
      { name: 'suggest_cases', args: { workspace: 'w1', summary: 'New coupon', cases } },
      app,
    );

    expect(app.suggested).toEqual([{ workspaceId: 'w1', summary: 'New coupon', cases }]);
    expect(done.text).toContain('They reach the plan only when the QA takes them');
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
      expect(done.text).toContain('suggest_cases');
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

    it('adds new cases to the plan at once, after the ones it has', async () => {
      const app = appWith({});

      const done = await call(
        { name: 'add_cases', args: { workspace: 'w1', cases: [CASE] } },
        app,
      );

      expect(done.isError).toBe(false);
      expect(app.asked).toEqual([]);
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

    it('changes a case only after the QA confirms it, in its place', async () => {
      const app = appWith({});

      const done = await call(
        {
          name: 'update_cases',
          args: { workspace: 'w1', cases: [{ ...CASE, id: 'TC-02' }] },
        },
        app,
      );

      expect(app.asked).toEqual([
        expect.objectContaining({ action: 'update_cases', detail: 'TC-02', count: 1 }),
      ]);
      expect(app.plans[0]?.plan.map(({ id, title }) => `${id} ${title}`)).toEqual([
        'TC-01 Open the store and find a product',
        'TC-02 Coupon',
      ]);
      expect(done.text).toContain('Changed TC-02 "Coupon"');
    });

    it('leaves the plan as it was when the QA keeps it', async () => {
      const app = appWith({ decision: 'kept' });

      const done = await call(
        { name: 'delete_cases', args: { workspace: 'w1', cases: ['tc-01'] } },
        app,
      );

      expect(app.plans).toEqual([]);
      expect(done.text).toContain('said no');
    });

    it('deletes cases once confirmed, and refuses one the plan lacks before asking', async () => {
      const app = appWith({});

      const gone = await call(
        { name: 'delete_cases', args: { workspace: 'w1', cases: ['TC-01'] } },
        app,
      );
      const unknown = await call(
        { name: 'delete_cases', args: { workspace: 'w1', cases: ['TC-09'] } },
        app,
      );

      expect(app.plans[0]?.plan.map(({ id }) => id)).toEqual(['TC-02']);
      expect(gone.text).toContain('Deleted TC-01');
      expect(unknown.isError).toBe(true);
      expect(app.asked).toHaveLength(1);
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

    it('changes a project through the assistant only after the QA confirms what changes', async () => {
      const app = appWith({});
      const change: OutsideToolCall = {
        name: 'update_project',
        args: { project: 'Loja', web: 'https://staging.shop.test' },
      };

      await call(change, app);

      expect(app.asked).toEqual([
        expect.objectContaining({
          action: 'update_project',
          subject: 'Loja',
          detail: 'web: https://staging.shop.test',
        }),
      ]);
      expect(app.performed).toEqual([change]);
    });

    it('does NOT touch the project when the QA lets the card go unanswered', async () => {
      const app = appWith({ decision: 'expired' });

      const done = await call(
        { name: 'update_project', args: { project: 'Loja', name: 'Shop' } },
        app,
      );

      expect(app.performed).toEqual([]);
      expect(done.text).toContain('did not answer');
    });

    it('asks before renaming a workspace, naming the new name', async () => {
      const app = appWith({});

      await call(
        { name: 'rename_workspace', args: { workspace: 'w1', name: 'Payments' } },
        app,
      );

      expect(app.asked).toEqual([
        expect.objectContaining({
          action: 'rename_workspace',
          subject: 'Checkout regression',
          detail: 'Payments',
        }),
      ]);
      expect(app.performed).toHaveLength(1);
    });

    // O assistente já pede ao QA antes de apagar ou mandar: um segundo cartão seria demais.
    it('hands deleting, sending and exploring to the assistant, which asks the QA itself', async () => {
      const app = appWith({});

      await call({ name: 'delete_workspace', args: { workspace: 'w1' } }, app);
      await call({ name: 'explore_app', args: { workspace: 'w1' } }, app);
      await call({ name: 'delete_project', args: { project: 'Loja' } }, app);

      expect(app.asked).toEqual([]);
      expect(app.performed.map(({ name }) => name)).toEqual([
        'delete_workspace',
        'explore_app',
        'delete_project',
      ]);
    });

    it('closes a bug only after the QA confirms, and opens one again without asking', async () => {
      const bugs = walkRun({ verdicts: ['failed'], isFinished: true }).bugs;
      const app = appWith({ workspaces: [{ ...makeWorkspace(), bugs }] });
      const bugId = bugs[0]?.id ?? '';

      await call({ name: 'dismiss_bug', args: { workspace: 'w1', bug: bugId } }, app);
      await call(
        { name: 'dismiss_bug', args: { workspace: 'w1', bug: bugId, reopen: true } },
        app,
      );

      expect(app.asked).toEqual([
        expect.objectContaining({
          action: 'dismiss_bug',
          subject: expect.stringContaining(bugId) as string,
        }),
      ]);
      expect(app.performed).toHaveLength(2);
    });
  });
});
