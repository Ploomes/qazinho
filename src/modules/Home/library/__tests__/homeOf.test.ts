import type { IWorkspace } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { homeOf } from '@/modules/Home/library';
import { endRun, landAsked, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';

const LOJA = { id: 'p1', name: 'Loja Web', targets: [], repositories: [] };

const home = (
  workspaces: IWorkspace[],
  over: Partial<Parameters<typeof homeOf>[0]> = {},
) =>
  homeOf({
    projects: [LOJA],
    workspaces: workspaces.map((workspace) => ({ ...workspace, projectId: 'p1' })),
    developed: {},
    recent: [],
    shown: 4,
    unnamed: 'New plan',
    ...over,
  });

describe('homeOf', () => {
  it('puts a question the agent asks in the group that waits for the QA', () => {
    const asked = landAsked({
      workspace: walkRun({ verdicts: ['passed'] }),
      question: QUESTION,
    });

    expect(home([asked]).asking).toEqual([
      {
        workspaceId: 'w1',
        plan: 'Checkout regression',
        project: 'Loja Web',
        kind: 'asking',
        question: 'Which plan should I pick?',
      },
    ]);
  });

  it('lists a run that goes with how far it is, and one the QA paused', () => {
    const going = walkRun({ verdicts: ['passed'] });
    const started = startRun({
      workspace: { ...makeWorkspace(), id: 'w2' },
      startedAt: '09:41',
      runId: 'r-02',
      by: WALKED_BY,
    });
    const paused = {
      ...started,
      live: started.live && { ...started.live, isRunning: false },
    };

    expect(home([going, paused]).going).toEqual([
      expect.objectContaining({
        workspaceId: 'w1',
        kind: 'running',
        current: 2,
        isExplore: false,
      }),
      expect.objectContaining({ workspaceId: 'w2', kind: 'paused' }),
    ]);
  });

  /** O app fechou no meio da run: o Início é o que a pessoa vê primeiro ao reabrir. */
  it('lists a run the app closed halfway, with the cases it did not finish', () => {
    const cut = endRun({
      workspace: walkRun({ verdicts: ['passed'] }),
      at: '09:42',
      endedBy: 'interrupted',
    });

    expect(home([cut]).toContinue).toEqual([
      expect.objectContaining({
        kind: 'toContinue',
        cases: expect.any(Number) as number,
      }),
    ]);
    expect(home([cut]).toContinue[0]?.cases).toBeGreaterThan(0);
  });

  it('lists a plan whose last run failed, with its failed cases and open bugs', () => {
    const failed = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

    expect(home([failed]).failed).toEqual([
      expect.objectContaining({ kind: 'failed', failed: 1, bugs: 1 }),
    ]);
  });

  it('does NOT count a bug the QA already dismissed', () => {
    const failed = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
    const dismissed = {
      ...failed,
      bugs: failed.bugs.map((bug) => ({ ...bug, isDismissed: true })),
    };

    expect(home([dismissed]).failed[0]?.bugs).toBe(0);
  });

  it('lists the cases a plan still has to develop, once it knows which are recorded', () => {
    const workspace = makeWorkspace();

    expect(home([workspace]).toDevelop).toEqual([]);
    expect(home([workspace], { developed: { w1: ['TC-01'] } }).toDevelop).toEqual([
      expect.objectContaining({ kind: 'toDevelop', cases: expect.any(Number) as number }),
    ]);
  });

  it('shows nothing for a plan that passed and has everything recorded', () => {
    const passed = walkRun({ verdicts: ['passed'], isFinished: true });
    const all = [...new Set(passed.plan.map(({ id }) => id))];
    const shown = home([passed], { developed: { w1: all } });

    expect([
      shown.asking,
      shown.going,
      shown.toContinue,
      shown.failed,
      shown.toDevelop,
    ]).toEqual([[], [], [], [], []]);
  });

  it('lists the plans opened lately, newest first, without one that is gone', () => {
    const shown = home(
      [makeWorkspace(), { ...makeWorkspace(), id: 'w2', name: 'Busca' }],
      {
        recent: [
          { workspaceId: 'w2', at: 2 },
          { workspaceId: 'gone', at: 1 },
          { workspaceId: 'w1', at: 0 },
        ],
        shown: 4,
        unnamed: 'New plan',
      },
    );

    expect(shown.recent.map(({ plan, project, at }) => [plan, project, at])).toEqual([
      ['Busca', 'Loja Web', 2],
      ['Checkout regression', 'Loja Web', 0],
    ]);
  });

  it('keeps only as many recent plans as the screen shows', () => {
    const shown = home([makeWorkspace(), { ...makeWorkspace(), id: 'w2' }], {
      recent: [
        { workspaceId: 'w2', at: 2 },
        { workspaceId: 'w1', at: 1 },
      ],
      shown: 1,
      unnamed: 'New plan',
    });

    expect(shown.recent).toHaveLength(1);
  });

  it('leaves out a plan whose project is gone', () => {
    expect(
      homeOf({
        projects: [],
        workspaces: [walkRun({ verdicts: ['passed', 'failed'], isFinished: true })],
        developed: {},
        recent: [{ workspaceId: 'w1', at: 0 }],
        shown: 4,
        unnamed: 'New plan',
      }),
    ).toMatchObject({ failed: [], recent: [] });
  });
});
