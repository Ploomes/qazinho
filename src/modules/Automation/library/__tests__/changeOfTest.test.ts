import type { ISuiteChange } from '@/modules/Automation/types';
import { describe, expect, it } from 'vitest';
import { changeOfTest } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

const change = (props: Partial<ISuiteChange> & { testId?: string }) =>
  ({
    id: 'c-01',
    startedAt: 1,
    status: 'ready',
    ask: { kind: 'fix', runId: 's-01', test: suiteTest({ id: props.testId ?? 't-1' }) },
    ...props,
  }) as ISuiteChange;

describe('changeOfTest', () => {
  it('finds the latest change for the test', () => {
    expect(
      changeOfTest({
        changes: [
          change({ id: 'c-01', startedAt: 1 }),
          change({ id: 'c-02', startedAt: 2 }),
        ],
        testId: 't-1',
      })?.id,
    ).toBe('c-02');
  });

  it('does NOT find a change the QA threw away, nor one of another test', () => {
    expect(
      changeOfTest({
        changes: [change({ status: 'discarded' }), change({ id: 'c-02', testId: 't-9' })],
        testId: 't-1',
      }),
    ).toBeNull();
  });
});
