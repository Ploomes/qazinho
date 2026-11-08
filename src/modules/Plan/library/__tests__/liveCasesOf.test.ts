import type { ITestCase } from '@/modules/Plan/types';
import type { IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { liveCasesOf } from '@/modules/Plan/library';

const testCase = (id: string, steps: number): ITestCase => ({
  id,
  title: `Case ${id}`,
  priority: 'P2',
  goal: '',
  preconditions: '',
  lastVerdict: 'failed',
  steps: Array.from({ length: steps }, (_, index) => ({
    action: `Do ${String(index + 1)}`,
    expected: 'It works',
  })),
});

const outcome = (props: {
  caseId: string;
  stepNumber: number;
  verdict: IStepOutcome['verdict'];
}): IStepOutcome =>
  ({
    ...props,
    action: 'Do',
    why: '',
    screenshot: null,
    shotFile: null,
    at: 10,
    tookMs: 1,
  }) as IStepOutcome;

const live = {
  outcomes: [] as IStepOutcome[],
  doingIndex: -1,
  caseIds: undefined as string[] | undefined,
  isDone: false,
  isRunning: true,
  question: undefined,
  kind: undefined,
};

const plan = [testCase('TC-01', 2), testCase('TC-02', 2), testCase('TC-03', 1)];

describe('liveCasesOf', () => {
  it('marks the case the run is on, and leaves the ones it has not reached pending', () => {
    const cases = liveCasesOf({ plan, live: { ...live, doingIndex: 2 } });

    expect(cases['TC-02']?.status).toBe('running');
    expect(cases['TC-02']?.run?.steps[0]).toMatchObject({
      number: 1,
      verdict: 'running',
    });
    expect(cases['TC-03']).toEqual({ status: 'pending', run: null });
  });

  it('shows how each finished case went while the run goes on', () => {
    const cases = liveCasesOf({
      plan,
      live: {
        ...live,
        doingIndex: 4,
        outcomes: [
          outcome({ caseId: 'TC-01', stepNumber: 1, verdict: 'passed' }),
          outcome({ caseId: 'TC-01', stepNumber: 2, verdict: 'failed' }),
          outcome({ caseId: 'TC-02', stepNumber: 1, verdict: 'passed' }),
          outcome({ caseId: 'TC-02', stepNumber: 2, verdict: 'passed' }),
        ],
      },
    });

    expect(cases['TC-01']?.status).toBe('failed');
    expect(cases['TC-02']?.status).toBe('passed');
    expect(cases['TC-03']?.status).toBe('running');
  });

  it('keeps a case current between two of its steps', () => {
    const cases = liveCasesOf({
      plan,
      live: {
        ...live,
        outcomes: [outcome({ caseId: 'TC-01', stepNumber: 1, verdict: 'passed' })],
      },
    });

    expect(cases['TC-01']?.status).toBe('running');
  });

  it('says a paused run is paused and a run that asked needs the QA', () => {
    expect(
      liveCasesOf({ plan, live: { ...live, doingIndex: 0, isRunning: false } })['TC-01']
        ?.status,
    ).toBe('paused');
    expect(
      liveCasesOf({
        plan,
        live: { ...live, doingIndex: 0, question: {} as never },
      })['TC-01']?.status,
    ).toBe('attention');
  });

  it('counts the place of a step inside the cases the run walks', () => {
    const cases = liveCasesOf({
      plan,
      live: { ...live, caseIds: ['TC-03'], doingIndex: 0 },
    });

    expect(cases['TC-03']?.status).toBe('running');
    expect(cases['TC-01']).toBeUndefined();
  });

  it('changes nothing with no run going, or for an exploration', () => {
    expect(liveCasesOf({ plan, live: null })).toEqual({});
    expect(liveCasesOf({ plan, live: { ...live, isDone: true } })).toEqual({});
    expect(liveCasesOf({ plan, live: { ...live, kind: 'explore' } })).toEqual({});
  });
});
