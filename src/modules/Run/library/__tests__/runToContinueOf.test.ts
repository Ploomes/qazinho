import type { ITestCase } from '@/modules/Plan/types';
import type { IRun, IRunCase, IRunStep } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { runToContinueOf } from '@/modules/Run/library';

const testCase = (id: string): ITestCase =>
  ({
    id,
    title: id,
    goal: '',
    preconditions: '',
    priority: 'P1',
    lastVerdict: null,
    steps: [
      { action: 'Primeiro', expected: 'Ok' },
      { action: 'Segundo', expected: 'Ok' },
    ],
  }) as unknown as ITestCase;

const step = (verdict: IRunStep['verdict'], isReached = true): IRunStep => ({
  number: 1,
  action: 'x',
  verdict,
  why: null,
  shot: null,
  shotFile: null,
  span: isReached ? { from: 0, to: 1 } : null,
  bugId: null,
});

const walked = (id: string, steps: IRunStep[]): IRunCase => ({
  id,
  title: id,
  verdict: 'passed',
  durationSec: 1,
  steps,
});

const run = (over: Partial<IRun>): IRun =>
  ({
    id: 'r-03',
    meta: '',
    startedAt: '',
    durationSec: 1,
    costUsd: null,
    counts: {},
    cases: [],
    endedBy: 'interrupted',
    video: null,
    ...over,
  }) as IRun;

const plan = ['TC-01', 'TC-02', 'TC-03'].map(testCase);

describe('runToContinueOf', () => {
  it('leaves out the cases that ended, and keeps the one cut in the middle', () => {
    expect(
      runToContinueOf({
        plan,
        runs: [
          run({
            cases: [
              walked('TC-01', [step('passed'), step('failed')]),
              walked('TC-02', [step('passed'), step('skipped', false)]),
            ],
          }),
        ],
      }),
    ).toEqual({ runId: 'r-03', mode: 'replay', caseIds: ['TC-02', 'TC-03'] });
  });

  it('counts a case that stopped on a failure as ended', () => {
    expect(
      runToContinueOf({
        plan: [testCase('TC-01')],
        runs: [
          run({ cases: [walked('TC-01', [step('failed'), step('skipped', false)])] }),
        ],
      }),
    ).toBeNull();
  });

  it('stays inside the cases the run was walking, and goes on the same way', () => {
    expect(
      runToContinueOf({
        plan,
        runs: [run({ caseIds: ['TC-02'], mode: 'agent' })],
      }),
    ).toEqual({ runId: 'r-03', mode: 'agent', caseIds: ['TC-02'] });
  });

  it('does NOT continue a run the QA stopped, or an older interrupted one', () => {
    expect(runToContinueOf({ plan, runs: [run({ endedBy: 'stopped' })] })).toBeNull();
    expect(
      runToContinueOf({
        plan,
        runs: [run({ id: 'r-04', endedBy: 'finished' }), run({})],
      }),
    ).toBeNull();
  });

  it('does NOT continue an exploration, or a plan with nothing left', () => {
    expect(runToContinueOf({ plan, runs: [run({ kind: 'explore' })] })).toBeNull();
    expect(runToContinueOf({ plan: [], runs: [run({})] })).toBeNull();
    expect(runToContinueOf({ plan, runs: [] })).toBeNull();
  });
});
