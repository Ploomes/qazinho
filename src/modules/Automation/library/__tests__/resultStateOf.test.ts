import { describe, expect, it } from 'vitest';
import { resultStateOf } from '@/modules/Automation/library';

describe('resultStateOf', () => {
  it('reads what Playwright said of the test', () => {
    expect(resultStateOf({ status: 'passed', isFlaky: false })).toBe('passed');
    expect(resultStateOf({ status: 'timedOut', isFlaky: false })).toBe('timedOut');
    expect(resultStateOf({ status: 'interrupted', isFlaky: false })).toBe('interrupted');
  });

  it('tells a pass on a retry apart as flaky', () => {
    expect(resultStateOf({ status: 'passed', isFlaky: true })).toBe('flaky');
  });

  /** Playwright marks flaky only what passed in the end; a failure stays a failure. */
  it('keeps a failure a failure, whatever the retries did', () => {
    expect(resultStateOf({ status: 'failed', isFlaky: true })).toBe('failed');
  });
});
