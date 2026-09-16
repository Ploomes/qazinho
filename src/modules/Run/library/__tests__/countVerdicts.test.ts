import { describe, expect, it } from 'vitest';
import { countVerdicts } from '@/modules/Run/library';

describe('countVerdicts', () => {
  it('counts one of each', () => {
    expect(countVerdicts(['passed', 'failed', 'blocked', 'skipped'])).toEqual({
      passed: 1,
      failed: 1,
      blocked: 1,
      skipped: 1,
    });
  });

  it('counts nothing for a run that has not resolved a step yet', () => {
    expect(countVerdicts([])).toEqual({ passed: 0, failed: 0, blocked: 0, skipped: 0 });
  });

  it('does NOT count a step that is still pending or running', () => {
    expect(countVerdicts(['passed', 'pending', 'running'])).toEqual({
      passed: 1,
      failed: 0,
      blocked: 0,
      skipped: 0,
    });
  });
});
