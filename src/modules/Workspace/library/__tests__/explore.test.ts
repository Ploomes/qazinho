import type { IWorkspace } from '@/modules/Workspace/types';
import type { IDraftedCase, IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import {
  endRun,
  landExplored,
  landFinding,
  landStep,
  resumeRun,
  startRun,
  takeSuggestion,
} from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY } from './fixtures';

const SUGGESTED: IDraftedCase[] = [
  {
    title: 'Cart total adds the items',
    priority: 'P1',
    goal: 'The total is the sum of the items.',
    preconditions: 'One shirt in the cart.',
    steps: [{ action: 'Open the cart', expected: 'Total R$ 79,90' }],
  },
];

function screen(props: {
  workspace: IWorkspace;
  number: number;
  name: string;
}): IStepOutcome {
  return {
    workspaceId: props.workspace.id,
    caseId: 'EX',
    stepNumber: props.number,
    index: props.number - 1,
    action: props.name,
    expected: '',
    verdict: 'passed',
    why: `What ${props.name} is for.`,
    got: '',
    title: '',
    severity: 'low',
    tookMs: 3_000,
    at: 1_760_000_000_000 + props.number * 3_000,
    screenshot: `data:image/jpeg;base64,screen-${String(props.number)}`,
    shotFile: `/tmp/screen-${String(props.number)}.jpg`,
  };
}

/**
 * Uma exploração de um workspace sem plano: duas telas, um bug na segunda, depois o fim
 * dela.
 */
function explored(props: { plan?: IWorkspace['plan']; cases?: IDraftedCase[] } = {}) {
  let workspace = startRun({
    workspace: makeWorkspace(props.plan ?? []),
    startedAt: '10:00',
    runId: 'r-01',
    by: WALKED_BY,
    kind: 'explore',
  });

  workspace = landStep({
    workspace,
    outcome: screen({ workspace, number: 1, name: 'Shop' }),
    at: '10:00',
  });
  workspace = landStep({
    workspace,
    outcome: screen({ workspace, number: 2, name: 'Cart' }),
    at: '10:01',
  });
  workspace = landFinding({
    workspace,
    finding: {
      caseId: 'EX',
      stepNumber: 2,
      index: 1,
      action: 'Cart',
      title: 'Cart total ignores the shirt',
      severity: 'high',
      at: 1_760_000_007_000,
      expected: 'Total R$ 79,90',
      got: 'Total R$ 0,00',
      screenshot: null,
      shotFile: null,
    },
    at: '10:01',
  });
  workspace = landExplored({
    workspace,
    summary: 'Two screens. The cart total is wrong.',
    cases: props.cases ?? SUGGESTED,
  });

  return endRun({ workspace, at: '10:02', endedBy: 'finished' });
}

describe('an exploration', () => {
  it('starts with no plan, where a run of the plan does not', () => {
    const empty = makeWorkspace([]);

    expect(
      startRun({ workspace: empty, startedAt: '10:00', runId: 'r-01', by: WALKED_BY })
        .live,
    ).toBeNull();
    expect(
      startRun({
        workspace: empty,
        startedAt: '10:00',
        runId: 'r-01',
        by: WALKED_BY,
        kind: 'explore',
      }).live,
    ).toMatchObject({ id: 'r-01', kind: 'explore', isRunning: true });
  });

  it('ends as a run whose one case is the screens it reached, with the plan it suggests', () => {
    const [run] = explored().runs;

    expect(run).toMatchObject({
      kind: 'explore',
      suggestion: { summary: 'Two screens. The cart total is wrong.', cases: SUGGESTED },
      cases: [
        {
          id: 'EX',
          steps: [
            { number: 1, action: 'Shop', why: 'What Shop is for.' },
            { number: 2, action: 'Cart', why: 'What Cart is for.' },
          ],
        },
      ],
    });
  });

  it('tells the chat how many screens and bugs, and leaves the suggestion waiting there', () => {
    const { chat, plan, status } = explored();

    expect(chat.at(-2)).toMatchObject({
      kind: 'run',
      runId: 'r-01',
      explored: { screens: 2, bugs: 1 },
    });
    expect(chat.at(-1)).toMatchObject({
      kind: 'suggestion',
      runId: 'r-01',
      cases: SUGGESTED,
      isTaken: false,
    });
    expect(plan).toEqual([]);
    expect(status).toBe('failed');
  });

  it('does NOT leave a suggestion in the chat when the explorer suggested nothing', () => {
    expect(explored({ cases: [] }).chat.at(-1)).toMatchObject({ kind: 'run' });
  });

  it('takes the suggested cases into the plan once, after the ones it holds', () => {
    const workspace = explored({ plan: makeWorkspace().plan });
    const messageId = workspace.chat.at(-1)?.id ?? '';
    const taken = takeSuggestion({ workspace, messageId, at: '10:03' });

    expect(taken.plan.map(({ id, title }) => `${id} ${title}`)).toEqual([
      'TC-01 Open the store and find a product',
      'TC-02 Checkout with a test card',
      'TC-03 Cart total adds the items',
    ]);
    expect(taken.chat.find(({ id }) => id === messageId)).toMatchObject({
      isTaken: true,
    });
    expect(taken.chat.at(-1)).toMatchObject({ kind: 'plan', caseCount: 3 });
    expect(takeSuggestion({ workspace: taken, messageId, at: '10:04' })).toBe(taken);
  });

  it('does NOT keep a finish that came for a run of the plan', () => {
    const walking = startRun({
      workspace: makeWorkspace(),
      startedAt: '10:00',
      runId: 'r-01',
      by: WALKED_BY,
    });

    expect(landExplored({ workspace: walking, summary: 'x', cases: SUGGESTED })).toBe(
      walking,
    );
  });

  it('picks an exploration up again as one, when the page opens while it goes', () => {
    const resumed = resumeRun({
      workspace: makeWorkspace([]),
      run: {
        workspaceId: 'w1',
        runId: 'r-01',
        startedAtMs: 1_000,
        doingIndex: -1,
        streamUrl: null,
        outcomes: [],
        isPaused: false,
        costUsd: null,
        findings: [],
        agentId: 'claude-code',
        model: 'haiku',
        targetKind: 'web',
        isExploring: true,
        question: null,
        asked: [],
      },
      now: 61_000,
      startedAt: '10:00',
      by: WALKED_BY,
    });

    expect(resumed.live?.kind).toBe('explore');
  });
});
