import { describe, expect, it } from 'vitest';
import { testStateOf } from '@/modules/Automation/library';
import { suiteResult } from './fixtures';

const last = (props: Parameters<typeof suiteResult>[0]) => ({
  result: suiteResult(props),
  runId: 's-01',
  endedAt: 1,
});

describe('testStateOf', () => {
  it('reads a test running now as running, whatever it did before', () => {
    expect(testStateOf({ isGoing: true, last: last({ status: 'failed' }) })).toBe(
      'running',
    );
  });

  it('reads how the test went the last time', () => {
    expect(testStateOf({ isGoing: false, last: last({ status: 'passed' }) })).toBe(
      'passed',
    );
    expect(testStateOf({ isGoing: false, last: last({ status: 'skipped' }) })).toBe(
      'skipped',
    );
  });

  it('reads a test that timed out or was cut short as failed', () => {
    expect(testStateOf({ isGoing: false, last: last({ status: 'timedOut' }) })).toBe(
      'failed',
    );
    expect(testStateOf({ isGoing: false, last: last({ status: 'interrupted' }) })).toBe(
      'failed',
    );
  });

  it('reads a pass on a retry as flaky', () => {
    expect(
      testStateOf({ isGoing: false, last: last({ status: 'passed', isFlaky: true }) }),
    ).toBe('flaky');
  });

  it('reads a test no run reached as not run', () => {
    expect(testStateOf({ isGoing: false, last: undefined })).toBe('pending');
  });
});
