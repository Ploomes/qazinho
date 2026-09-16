import { RUN_ENGINE } from '@/modules/Run/constants';
import { verdictForStep } from '@/modules/Run/library';
import { describe, expect, it } from 'vitest';

describe('verdictForStep', () => {
  it('passes every step before the one that breaks', () => {
    expect(verdictForStep(1)).toBe('passed');
    expect(verdictForStep(RUN_ENGINE.failsAtStep - 1)).toBe('passed');
  });

  it('fails the step the mock run always breaks on', () => {
    expect(verdictForStep(RUN_ENGINE.failsAtStep)).toBe('failed');
  });

  it('skips the step right after the failure, not the ones further down', () => {
    expect(verdictForStep(RUN_ENGINE.failsAtStep + 1)).toBe('skipped');
    expect(verdictForStep(RUN_ENGINE.failsAtStep + 2)).toBe('passed');
  });
});
