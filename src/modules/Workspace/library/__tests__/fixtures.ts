import type { ITestCase } from '@/modules/Plan';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome, StepVerdict } from '@/shared/types';
import { flattenPlanSteps } from '@/modules/Run';
import { endRun } from '@/modules/Workspace/library/endRun';
import { landStep } from '@/modules/Workspace/library/landStep';
import { startRun } from '@/modules/Workspace/library/startRun';

export const CASES: ITestCase[] = [
  {
    id: 'TC-01',
    title: 'Open the store and find a product',
    priority: 'P1',
    goal: 'The site loads.',
    preconditions: 'The URL answers.',
    steps: [
      { action: 'Open the target URL', expected: 'The home page loads' },
      { action: 'Search for a product', expected: 'At least one result comes back' },
      { action: 'Open the first result', expected: 'The page shows a price' },
    ],
    lastVerdict: null,
  },
  {
    id: 'TC-02',
    title: 'Checkout with a test card',
    priority: 'P1',
    goal: 'A card order goes through.',
    preconditions: 'One product in the cart.',
    steps: [
      { action: 'Add the product to the cart', expected: 'The cart badge reads 1' },
      { action: 'Leave the house number empty', expected: 'An inline error asks for it' },
      {
        action: 'Pay with the test card',
        expected: 'A confirmation with an order number',
      },
    ],
    lastVerdict: null,
  },
];

export function makeWorkspace(plan: ITestCase[] = CASES): IWorkspace {
  return {
    id: 'w1',
    projectId: 'p1',
    name: 'Checkout regression',
    targetId: 't1',
    planKind: 'web',
    viewportId: 'desktop',
    sessionId: null,
    status: 'idle',
    issue: null,
    chat: [],
    plan,
    runs: [],
    bugs: [],
    live: null,
    hasBeenAsked: false,
    context: null,
  };
}

export function makeOutcome(props: {
  workspace: IWorkspace;
  index: number;
  verdict: StepVerdict;
}): IStepOutcome {
  const { workspace, index, verdict } = props;
  const step = flattenPlanSteps(workspace.plan)[index];

  return {
    workspaceId: workspace.id,
    caseId: step?.caseId ?? 'TC-01',
    stepNumber: step?.numberInCase ?? 1,
    index,
    action: step?.action ?? '',
    expected: step?.expected ?? '',
    verdict,
    why: verdict === 'passed' ? '' : 'The page did not do it.',
    got: verdict === 'passed' ? '' : 'Nothing moved.',
    title: verdict === 'failed' ? 'Nothing happens on submit' : '',
    severity: 'high',
    tookMs: 2_000,
    screenshot:
      verdict === 'skipped' ? null : `data:image/jpeg;base64,shot-${String(index)}`,
    shotFile: verdict === 'skipped' ? null : `/tmp/qazinho/step-${String(index + 1)}.jpg`,
  };
}

/** A run that already happened: one outcome per verdict, in plan order. */
export function walkRun(props: {
  workspace?: IWorkspace;
  verdicts: StepVerdict[];
  isFinished?: boolean;
}): IWorkspace {
  const started = startRun({
    workspace: props.workspace ?? makeWorkspace(),
    startedAt: '09:41',
    runId: 'r-01',
  });

  let walked = started;

  for (const [index, verdict] of props.verdicts.entries())
    walked = landStep({
      workspace: walked,
      outcome: makeOutcome({ workspace: walked, index, verdict }),
      at: '09:41',
    });

  return props.isFinished === true
    ? endRun({ workspace: walked, at: '09:42', endedBy: 'finished' })
    : walked;
}
