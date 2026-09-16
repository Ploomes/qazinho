import { describe, expect, it } from 'vitest';
import {
  addCase,
  addStep,
  editCase,
  editStep,
  nextCaseId,
  removeCase,
  removeStep,
} from '@/modules/Plan/library';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

describe('editStep', () => {
  it('changes the one step the QA typed in', () => {
    const plan = editStep({
      plan: CASES,
      caseId: 'TC-01',
      index: 1,
      step: { action: 'Search for a hat' },
    });

    expect(plan[0]?.steps[1]?.action).toBe('Search for a hat');
    expect(plan[0]?.steps[1]?.expected).toBe('At least one result comes back');
    expect(plan[0]?.steps[0]).toEqual(CASES[0]?.steps[0]);
  });

  it('leaves every other case alone', () => {
    const plan = editStep({
      plan: CASES,
      caseId: 'TC-01',
      index: 0,
      step: { action: '' },
    });

    expect(plan[1]).toBe(CASES[1]);
  });
});

describe('addStep', () => {
  it('adds an empty step at the end, for the QA to fill in', () => {
    const plan = addStep({ plan: CASES, caseId: 'TC-02' });

    expect(plan[1]?.steps).toHaveLength(4);
    expect(plan[1]?.steps.at(-1)).toEqual({ action: '', expected: '' });
  });
});

describe('removeStep', () => {
  it('drops the step at that place', () => {
    const plan = removeStep({ plan: CASES, caseId: 'TC-01', index: 0 });

    expect(plan[0]?.steps.map(({ action }) => action)).toEqual([
      'Search for a product',
      'Open the first result',
    ]);
  });

  it('a case with one step keeps it, because a case with none is not a case', () => {
    const one = [{ ...CASES[0]!, steps: [CASES[0]!.steps[0]!] }];

    expect(removeStep({ plan: one, caseId: 'TC-01', index: 0 })[0]?.steps).toHaveLength(
      1,
    );
  });
});

describe('editCase', () => {
  it('changes only the fields it was handed', () => {
    const plan = editCase({ plan: CASES, caseId: 'TC-02', fields: { priority: 'P3' } });

    expect(plan[1]?.priority).toBe('P3');
    expect(plan[1]?.title).toBe('Checkout with a test card');
  });
});

describe('removeCase', () => {
  it('drops the case and leaves the rest in order', () => {
    expect(removeCase({ plan: CASES, caseId: 'TC-01' }).map(({ id }) => id)).toEqual([
      'TC-02',
    ]);
  });
});

describe('addCase', () => {
  it('adds an empty case with one empty step at the end', () => {
    const plan = addCase(CASES);

    expect(plan).toHaveLength(3);
    expect(plan[2]).toMatchObject({
      id: 'TC-03',
      title: '',
      steps: [{ action: '', expected: '' }],
      lastVerdict: null,
    });
  });
});

describe('nextCaseId', () => {
  it('numbers after the highest already used, not after the count', () => {
    const plan = [{ ...CASES[0]!, id: 'TC-09' }];

    expect(nextCaseId(plan)).toBe('TC-10');
  });

  it('starts at one on an empty plan', () => {
    expect(nextCaseId([])).toBe('TC-01');
  });

  it('ignores an id the agent wrote in its own shape', () => {
    expect(nextCaseId([{ ...CASES[0]!, id: 'checkout' }])).toBe('TC-01');
  });
});
