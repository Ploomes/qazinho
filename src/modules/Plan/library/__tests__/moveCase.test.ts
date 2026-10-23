import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { moveCase } from '@/modules/Plan/library';

const testCase = (id: string): ITestCase => ({
  id,
  title: id,
  priority: 'P2',
  goal: '',
  preconditions: '',
  steps: [],
  lastVerdict: null,
});
const PLAN = [testCase('TC-01'), testCase('TC-02'), testCase('TC-03')];
const ids = (plan: ITestCase[]) => plan.map(({ id }) => id);

describe('moveCase', () => {
  it('moves a case one place down, and one place up', () => {
    expect(ids(moveCase({ plan: PLAN, caseId: 'TC-01', by: 1 }))).toEqual([
      'TC-02',
      'TC-01',
      'TC-03',
    ]);
    expect(ids(moveCase({ plan: PLAN, caseId: 'TC-03', by: -1 }))).toEqual([
      'TC-01',
      'TC-03',
      'TC-02',
    ]);
  });

  it('leaves the plan as it was at either end, or for a case it does not hold', () => {
    expect(moveCase({ plan: PLAN, caseId: 'TC-01', by: -1 })).toBe(PLAN);
    expect(moveCase({ plan: PLAN, caseId: 'TC-03', by: 1 })).toBe(PLAN);
    expect(moveCase({ plan: PLAN, caseId: 'TC-09', by: 1 })).toBe(PLAN);
  });
});
