import type { ISuiteResult } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { suiteStatusOf } from '@/main/classes/automation/SuiteRunner/library';

const result = (status: ISuiteResult['status']): ISuiteResult => ({
  testId: status,
  title: status,
  file: 'tests/a.spec.ts',
  line: 1,
  project: '',
  status,
  isFlaky: false,
  durationMs: 1,
  error: null,
  attachments: [],
});

describe('suiteStatusOf', () => {
  it('passes a run whose tests all passed or were skipped', () => {
    expect(
      suiteStatusOf({
        results: [result('passed'), result('skipped')],
        isStopped: false,
        isBroken: false,
      }),
    ).toBe('passed');
  });

  it('fails a run with a test that failed, timed out or was cut short', () => {
    for (const status of ['failed', 'timedOut', 'interrupted'] as const)
      expect(
        suiteStatusOf({
          results: [result('passed'), result(status)],
          isStopped: false,
          isBroken: false,
        }),
      ).toBe('failed');
  });

  it('says the QA stopped it before anything else', () => {
    expect(
      suiteStatusOf({ results: [result('failed')], isStopped: true, isBroken: true }),
    ).toBe('stopped');
  });

  it('says it broke when Playwright could not see it through, whatever ran before', () => {
    expect(
      suiteStatusOf({ results: [result('passed')], isStopped: false, isBroken: true }),
    ).toBe('broke');
  });

  it('passes a run with nothing to run', () => {
    expect(suiteStatusOf({ results: [], isStopped: false, isBroken: false })).toBe(
      'passed',
    );
  });
});
