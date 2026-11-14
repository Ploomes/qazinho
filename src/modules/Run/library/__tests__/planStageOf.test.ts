import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { planStageOf } from '@/modules/Run/library';

const testCase = (id: string, action = 'Open the app'): ITestCase => ({
  id,
  title: id,
  priority: 'P2',
  goal: '',
  preconditions: '',
  lastVerdict: null,
  steps: [{ action, expected: 'It opens' }],
});

describe('planStageOf', () => {
  const plan = [testCase('TC-01'), testCase('TC-02'), testCase('TC-03')];

  it('splits what is developed from what is left', () => {
    expect(planStageOf({ plan, developed: ['TC-02'] })).toEqual({
      total: 3,
      developed: ['TC-02'],
      toDevelop: ['TC-01', 'TC-03'],
      manual: [],
    });
  });

  it('keeps a case the QA walks by hand out of what is developed and what is left', () => {
    expect(
      planStageOf({
        plan: [...plan, { ...testCase('TC-04'), isManual: true }],
        developed: ['TC-02'],
      }),
    ).toEqual({
      total: 3,
      developed: ['TC-02'],
      toDevelop: ['TC-01', 'TC-03'],
      manual: ['TC-04'],
    });
  });

  it('forgets a recording of a case the plan no longer holds', () => {
    expect(planStageOf({ plan, developed: ['TC-09'] }).developed).toEqual([]);
  });

  it('does NOT count a case with nothing to walk', () => {
    expect(
      planStageOf({ plan: [...plan, testCase('TC-04', ' ')], developed: [] }).total,
    ).toBe(3);
  });
});
