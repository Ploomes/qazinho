import { describe, expect, it } from 'vitest';
import { caseVerdict } from '@/modules/Run/library';

const steps = (...verdicts: ('passed' | 'failed' | 'blocked' | 'skipped')[]) =>
  verdicts.map((verdict) => ({ verdict }));

describe('caseVerdict', () => {
  it('passes a case only when every step passed', () => {
    expect(caseVerdict(steps('passed', 'passed'))).toBe('passed');
  });

  it('fails a case as soon as one step failed, whatever else happened', () => {
    expect(caseVerdict(steps('passed', 'blocked', 'failed', 'skipped'))).toBe('failed');
  });

  it('does NOT call a case failed when a step was only blocked', () => {
    expect(caseVerdict(steps('passed', 'blocked', 'skipped'))).toBe('blocked');
  });

  it('reads a case where nothing ran as skipped', () => {
    expect(caseVerdict(steps('skipped', 'skipped'))).toBe('skipped');
    expect(caseVerdict([])).toBe('skipped');
  });
});
