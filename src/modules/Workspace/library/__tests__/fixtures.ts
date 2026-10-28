import type { ITestCase } from '@/modules/Plan';
import type { IWalkedBy, IWorkspace } from '@/modules/Workspace/types';
import type { IRunQuestion, IRunVideo, IStepOutcome, StepVerdict } from '@/shared/types';
import { flattenPlanSteps } from '@/modules/Run';
import { endRun } from '@/modules/Workspace/library/endRun';
import { landStep } from '@/modules/Workspace/library/landStep';
import { landVideo } from '@/modules/Workspace/library/landVideo';
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

/** O que o agente de uma run pergunta ao QA no segundo passo do TC-01. */
export const QUESTION: IRunQuestion = {
  id: 'q-1',
  question: 'Which plan should I pick?',
  options: ['Premium', 'Premium+'],
  isSecret: false,
  secret: { name: 'QA_ANSWER_1', description: 'Which plan should I pick?' },
  caseId: 'TC-01',
  stepNumber: 2,
  action: 'Search for a product',
  askedAtMs: 1_760_000_004_000,
  waitsUntilMs: 1_760_000_904_000,
};

export const WALKED_BY: IWalkedBy = {
  agent: 'Claude Code',
  modelName: 'Haiku',
  targetKind: 'web',
};

export function makeWorkspace(plan: ITestCase[] = CASES): IWorkspace {
  return {
    id: 'w1',
    projectId: 'p1',
    name: 'Checkout regression',
    targetId: 't1',
    planKind: 'web',
    viewportId: 'desktop',
    sessionId: null,
    sessionAgentId: null,
    status: 'idle',
    issue: null,
    design: null,
    chat: [],
    plan,
    planSource: null,
    sourcePage: null,
    unreadPlan: null,
    plainValues: [],
    published: null,
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
    at: 1_760_000_000_000 + (index + 1) * 2_000,
    screenshot:
      verdict === 'skipped' ? null : `data:image/jpeg;base64,shot-${String(index)}`,
    shotFile: verdict === 'skipped' ? null : `/tmp/qazinho/step-${String(index + 1)}.jpg`,
  };
}

/** Uma run que já aconteceu: um resultado por veredito, na ordem do plano. */
export function walkRun(props: {
  workspace?: IWorkspace;
  verdicts: StepVerdict[];
  isFinished?: boolean;
  by?: IWalkedBy;
}): IWorkspace {
  const started = startRun({
    workspace: props.workspace ?? makeWorkspace(),
    startedAt: '09:41',
    runId: 'r-01',
    by: props.by ?? WALKED_BY,
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

/**
 * A gravação da `recordedRun`: o primeiro frame dela vem 500ms depois de o primeiro passo
 * começar, e ela dura 12s.
 */
export const RECORDING: IRunVideo = {
  startedAt: 1_760_000_000_500,
  durationMs: 12_000,
  width: 1280,
  height: 800,
};

/**
 * Uma run terminada com a gravação. Cada passo leva 2s, então no vídeo o TC-01 vai de 0 a
 * 5,5s e o TC-02 de 5,5s a 11,5s, e o bug em que o segundo passo dele virou é pego aos
 * 9,5s.
 */
export function recordedRun(
  verdicts: StepVerdict[] = ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
): IWorkspace {
  return landVideo({
    workspace: walkRun({ verdicts, isFinished: true }),
    runId: 'r-01',
    video: RECORDING,
  });
}
