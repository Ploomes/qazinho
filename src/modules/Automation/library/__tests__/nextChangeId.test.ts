import type { ISuiteChange } from '@/modules/Automation/types';
import { describe, expect, it } from 'vitest';
import { nextChangeId } from '@/modules/Automation/library';

describe('nextChangeId', () => {
  it('counts one past the highest change', () => {
    expect(
      nextChangeId([{ id: 'c-02' }, { id: 'c-07' }, { id: 'odd' }] as ISuiteChange[]),
    ).toBe('c-08');
  });

  it('starts a project with no change at c-01', () => {
    expect(nextChangeId([])).toBe('c-01');
  });
});
