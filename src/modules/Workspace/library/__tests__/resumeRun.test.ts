import type { IRunInFlight } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { endRun, landStep, resumeRun, startRun } from '@/modules/Workspace/library';
import { makeOutcome, makeWorkspace, QUESTION, WALKED_BY } from './fixtures';

const STARTED = 1_000_000;

function inFlight(props: Partial<IRunInFlight> = {}): IRunInFlight {
  const workspace = makeWorkspace();

  return {
    workspaceId: workspace.id,
    runId: 'r-01',
    startedAtMs: STARTED,
    doingIndex: 2,
    streamUrl: 'http://127.0.0.1:5000/t/w1',
    outcomes: [
      makeOutcome({ workspace, index: 0, verdict: 'passed' }),
      makeOutcome({ workspace, index: 1, verdict: 'failed' }),
    ],
    isPaused: false,
    costUsd: 0.3,
    findings: [],
    agentId: 'claude-code',
    model: 'haiku',
    targetKind: 'web',
    isExploring: false,
    question: null,
    asked: [],
    ...props,
  };
}

const resumed = (
  props: { workspace?: ReturnType<typeof makeWorkspace>; run?: IRunInFlight } = {},
) =>
  resumeRun({
    workspace: props.workspace ?? makeWorkspace(),
    run: props.run ?? inFlight(),
    now: STARTED + 95_400,
    startedAt: '22:19',
    by: WALKED_BY,
  });

describe('resumeRun', () => {
  it('follows the run again where main has it: the step, the stream and the verdicts', () => {
    const workspace = resumed();

    expect(workspace.status).toBe('running');
    expect(workspace.live).toMatchObject({
      id: 'r-01',
      doingIndex: 2,
      isRunning: true,
      isDone: false,
      elapsedSec: 95,
      startedAt: '22:19',
      streamUrl: 'http://127.0.0.1:5000/t/w1',
      shot: 'data:image/jpeg;base64,shot-1',
      costUsd: 0.3,
    });
    expect(workspace.live?.outcomes).toHaveLength(2);
  });

  it('files the failures it missed as bugs, so they are not lost with the reload', () => {
    expect(
      resumed().bugs.map(({ caseId, stepNumber }) => `${caseId} ${String(stepNumber)}`),
    ).toEqual(['TC-01 2']);
  });

  it('does NOT file a failure twice when the page already had it as a bug', () => {
    const before = startRun({
      workspace: makeWorkspace(),
      runId: 'r-01',
      startedAt: '22:19',
      by: WALKED_BY,
    });
    const landed = landStep({
      workspace: landStep({
        workspace: before,
        outcome: inFlight().outcomes[0]!,
        at: '22:19',
      }),
      outcome: inFlight().outcomes[1]!,
      at: '22:20',
    });
    const withBug = { ...landed, live: null };

    expect(resumed({ workspace: withBug }).bugs).toHaveLength(1);
  });

  it('keeps a paused run paused', () => {
    expect(resumed({ run: inFlight({ isPaused: true }) }).live?.isRunning).toBe(false);
  });

  it('leaves a workspace alone when it is already following that run', () => {
    const following = startRun({
      workspace: makeWorkspace(),
      runId: 'r-01',
      startedAt: '22:19',
      by: WALKED_BY,
    });

    expect(resumed({ workspace: following })).toBe(following);
  });

  it('drops the record saved as interrupted, since the run is still walking', () => {
    const interrupted = endRun({
      workspace: resumed(),
      at: '22:25',
      endedBy: 'interrupted',
    });
    const followed = resumed({ workspace: interrupted });

    expect(followed.runs).toEqual([]);
    expect(followed.chat.filter(({ kind }) => kind === 'run')).toEqual([]);
    expect(followed.live?.isDone).toBe(false);
  });

  it('lets the run finish into a run the QA can open, with what it decided before the reload', () => {
    const finished = endRun({ workspace: resumed(), at: '22:30', endedBy: 'finished' });

    expect(finished.runs[0]?.counts).toMatchObject({ passed: 1, failed: 1 });
  });

  it('files the bugs found on the side while the page was away, once', () => {
    const finding = {
      caseId: 'TC-01',
      stepNumber: 1,
      index: 0,
      action: 'Open the target URL',
      title: 'Yearly price differs',
      severity: 'low' as const,
      expected: 'One price',
      got: 'Two prices',
      at: 1_760_000_000_000,
      screenshot: null,
      shotFile: null,
    };
    const once = resumed({ run: inFlight({ findings: [finding] }) });

    expect(once.bugs.filter(({ isIncidental }) => isIncidental)).toHaveLength(1);
    expect(
      resumeRun({
        workspace: { ...once, live: null },
        run: inFlight({ findings: [finding] }),
        now: STARTED,
        startedAt: '22:19',
        by: WALKED_BY,
      }).bugs.filter(({ isIncidental }) => isIncidental),
    ).toHaveLength(1);
  });

  it('waits again on the question the agent asked while the page was away, for as long as it has waited', () => {
    const workspace = resumed({
      run: inFlight({ question: { ...QUESTION, askedAtMs: STARTED + 60_400 } }),
    });

    expect(workspace.live?.question).toEqual({
      ...QUESTION,
      askedAtMs: STARTED + 60_400,
      waitedSec: 35,
    });
  });

  it("puts the questions already answered in the run's section once, and keeps them", () => {
    const asked = {
      id: 'q-1',
      question: 'Which plan should I pick?',
      caseId: 'TC-01',
      stepNumber: 2,
      answer: { kind: 'unanswered' as const },
      askedAtMs: STARTED + 1_000,
      answeredAtMs: STARTED + 901_000,
    };
    const once = resumed({ run: inFlight({ asked: [asked] }) });
    const reloaded = { ...once, live: null };
    const again = resumed({ workspace: reloaded, run: inFlight({ asked: [asked] }) });

    expect(once.live?.asked).toEqual([asked]);
    expect(again.chat.filter(({ kind }) => kind === 'ask')).toHaveLength(1);
  });
});
