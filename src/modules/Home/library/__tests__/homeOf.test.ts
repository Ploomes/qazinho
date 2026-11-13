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

  it('lists the cases by hand that wait for the QA once the plan ran, the first named', () => {
    const workspace = makeWorkspace();
    const ran = walkRun({
      workspace: {
        ...workspace,
        plan: workspace.plan.map((one) =>
          one.id === 'TC-02' ? { ...one, isManual: true } : one,
        ),
      },
      verdicts: ['passed', 'passed', 'passed'],
      isFinished: true,
    });

    expect(home([workspace]).byHand).toEqual([]);
    expect(home([ran]).byHand).toEqual([
      expect.objectContaining({ kind: 'byHand', cases: 1, caseId: 'TC-02' }),
    ]);
  });

  /**
   * Um plano escrito antes do app volta ao Início quando a história dele chega para teste,
   * e uma dúvida respondida na história, enquanto ainda segura casos.
   */
  it('lists a story that arrived for testing in its own group, not among the plans to develop', () => {
    const arrived = {
      ...makeWorkspace(),
      storyStage: 'arrived' as const,
      issue: {
        key: 'SHOP-878',
        title: 'Coupons',
        source: 'jira' as const,
        url: 'https://shop.atlassian.net/browse/SHOP-878',
      },
    };
    const shown = home([arrived], { developed: { w1: [] } });

    expect(shown.arrived).toEqual([
      expect.objectContaining({
        kind: 'arrived',
        key: 'SHOP-878',
        plan: 'Checkout regression',
      }),
    ]);
    expect(shown.toDevelop).toEqual([]);
  });

  it('lists the doubts the team answered while cases still wait for them', () => {
    const workspace = makeWorkspace();
    const answer = { text: 'They stack.', by: 'Rui PO', at: '2026-11-13T15:00:00.000Z' };
    const sent = {
      url: 'https://shop.atlassian.net/browse/SHOP-878',
      at: '2026-11-13T13:00:00.000Z',
    };
    const held = {
      ...workspace,
      plan: workspace.plan.map((one, index) =>
        index === 0 ? { ...one, blockedBy: ['D1'] } : one,
      ),
      doubts: [{ id: 'D1', question: 'Stack?', sent, answer }],
    };

    expect(home([held]).answered).toEqual([
      expect.objectContaining({ kind: 'answered', ids: ['D1'] }),
    ]);
    expect(
      home([{ ...workspace, doubts: [{ id: 'D1', question: 'Stack?', sent, answer }] }])
        .answered,
    ).toEqual([]);
  });

  it('lists a plan whose sources changed, and one with swaps still to review', () => {
    const found = {
      kind: 'story' as const,
      key: 'SHOP-878',
      url: 'https://shop.atlassian.net/browse/SHOP-878',
      at: '2026-11-13',
      before: '3',
      after: '5',
      comments: [],
    };
    const changed = {
      ...makeWorkspace(),
      changed: { found: [found], snapshots: [], code: null, at: '2026-11-13' },
    };
    const reviewing = {
      ...changed,
      id: 'w2',
      review: {
        summary: 'Mudou.',
        at: '2026-11-13',
        items: [
          {
            id: 'R1',
            kind: 'doubt' as const,
            question: 'Quanto?',
            state: 'open' as const,
          },
          {
            id: 'R2',
            kind: 'doubt' as const,
            question: 'Onde?',
            state: 'refused' as const,
          },
        ],
      },
    };

    expect(home([changed, reviewing]).changed).toEqual([
      expect.objectContaining({ kind: 'changed', sources: ['SHOP-878'], toReview: 0 }),
      expect.objectContaining({ workspaceId: 'w2', toReview: 1 }),
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
