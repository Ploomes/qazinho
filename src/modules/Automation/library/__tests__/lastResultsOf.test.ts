import { describe, expect, it } from 'vitest';
import { lastResultsOf } from '@/modules/Automation/library';
import { suiteResult, suiteRun } from './fixtures';

describe('lastResultsOf', () => {
  it('keeps how each test went in the latest run that reached it', () => {
    const last = lastResultsOf([
      suiteRun({
        id: 's-02',
        endedAt: 20,
        results: [suiteResult({ testId: 't-1', status: 'failed' })],
      }),
      suiteRun({
        id: 's-01',
        endedAt: 10,
        results: [
          suiteResult({ testId: 't-1', status: 'passed' }),
          suiteResult({ testId: 't-2', status: 'passed' }),
        ],
      }),
    ]);

    expect(last['t-1']).toMatchObject({
      runId: 's-02',
      endedAt: 20,
      result: { status: 'failed' },
    });
    expect(last['t-2']).toMatchObject({ runId: 's-01', result: { status: 'passed' } });
  });

  it('knows nothing of a test no run reached', () => {
    expect(lastResultsOf([suiteRun({})])).toEqual({});
  });
});
