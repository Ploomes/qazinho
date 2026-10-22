import { describe, expect, it } from 'vitest';
import { nextSuiteRunId } from '@/modules/Automation/library';
import { suiteRun } from './fixtures';

describe('nextSuiteRunId', () => {
  it('starts at s-01', () => {
    expect(nextSuiteRunId([])).toBe('s-01');
  });

  it('goes one past the highest run, whatever their order', () => {
    expect(nextSuiteRunId([suiteRun({ id: 's-02' }), suiteRun({ id: 's-09' })])).toBe(
      's-10',
    );
  });

  it('ignores an id that is not a suite run', () => {
    expect(nextSuiteRunId([suiteRun({ id: 'weird' })])).toBe('s-01');
  });
});
