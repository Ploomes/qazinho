import { describe, expect, it } from 'vitest';
import { stepVerdictsOf } from '@/modules/Device/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { CASES, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const STEPS = flattenPlanSteps(CASES);

describe('stepVerdictsOf', () => {
  it('follows the run going: what it judged, the step it is on, and what is still ahead', () => {
    const running = walkRun({ verdicts: ['passed'] });
    const live = { ...running.live!, doingIndex: 1 };

    expect(stepVerdictsOf({ steps: STEPS, live, lastRun: null }).slice(0, 3)).toEqual([
      'passed',
      'running',
      'pending',
    ]);
  });

  it('reads the last run when none is going, case by case and step by step', () => {
    const lastRun = walkRun({ verdicts: ['passed', 'failed'], isFinished: true })
      .runs[0]!;

    expect(stepVerdictsOf({ steps: STEPS, live: null, lastRun })).toEqual([
      'passed',
      'failed',
      'skipped',
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('holds every step pending before the first run', () => {
    expect(
      stepVerdictsOf({ steps: STEPS, live: null, lastRun: null }).every(
        (verdict) => verdict === 'pending',
      ),
    ).toBe(true);
  });
});
