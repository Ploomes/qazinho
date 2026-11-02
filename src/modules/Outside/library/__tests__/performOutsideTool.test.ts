import type { IOutsidePort } from '@/modules/Outside/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { INetworkEntry, OutsideToolCall } from '@/shared/types';
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
}) {
  let workspaces = props.workspaces ?? [makeWorkspace()];
  const started: unknown[] = [];
  const stopped: string[] = [];
  const suggested: unknown[] = [];
  const waited: number[] = [];
  const port: IOutsidePort = {
    read: () => ({
      isLoaded: props.isLoaded ?? true,
      projects: [PROJECT],
      workspaces,
    }),
    now: () => NOW,
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
    suggestCases: (suggestion) => {
      suggested.push(suggestion);
    },
  };

  return { port, started, stopped, suggested, waited };
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
});
