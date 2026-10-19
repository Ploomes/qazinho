import type { IRunInFlight, IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { followRunEvent } from '@/main/classes/runs/RunCoordinator/library';

const RUN: IRunInFlight = {
  workspaceId: 'w1',
  runId: 'r-01',
  startedAtMs: 0,
  doingIndex: -1,
  streamUrl: null,
  outcomes: [],
  isPaused: false,
  costUsd: null,
  findings: [],
  agentId: 'claude-code',
  model: 'haiku',
  targetKind: 'web',
};

const OUTCOME = { workspaceId: 'w1', index: 0, verdict: 'passed' } as IStepOutcome;

describe('followRunEvent', () => {
  it('moves to the step the agent is on', () => {
    expect(
      followRunEvent({ run: RUN, event: { kind: 'doing', workspaceId: 'w1', index: 3 } })
        .doingIndex,
    ).toBe(3);
  });

  it('keeps the stream address, so a page that opens later can watch', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: { kind: 'streaming', workspaceId: 'w1', url: 'http://x' },
      }).streamUrl,
    ).toBe('http://x');
  });

  it('keeps every verdict, and is on no step until the next one starts', () => {
    const doing = { ...RUN, doingIndex: 0 };
    const after = followRunEvent({
      run: doing,
      event: { kind: 'step', outcome: OUTCOME },
    });

    expect(after.outcomes).toEqual([OUTCOME]);
    expect(after.doingIndex).toBe(-1);
  });

  it('does NOT change for a note, which only the chat keeps', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: { kind: 'note', workspaceId: 'w1', text: 'hi' },
      }),
    ).toBe(RUN);
  });

  it('adds up what each case cost, so a page that opens later shows the run so far', () => {
    const once = followRunEvent({
      run: RUN,
      event: { kind: 'cost', workspaceId: 'w1', costUsd: 0.02 },
    });

    expect(once.costUsd).toBe(0.02);
    expect(
      followRunEvent({
        run: once,
        event: { kind: 'cost', workspaceId: 'w1', costUsd: 0.03 },
      }).costUsd,
    ).toBeCloseTo(0.05);
  });

  it('keeps every bug filed on the side of a step, for a page that opens later', () => {
    const finding = {
      caseId: 'TC-01',
      stepNumber: 2,
      index: 1,
      action: 'Open Premium',
      title: 'Yearly price differs',
      severity: 'medium' as const,
      expected: 'One price',
      got: '$20.49 and $20.40',
      screenshot: null,
      shotFile: null,
    };

    expect(
      followRunEvent({ run: RUN, event: { kind: 'finding', workspaceId: 'w1', finding } })
        .findings,
    ).toEqual([finding]);
  });
});
