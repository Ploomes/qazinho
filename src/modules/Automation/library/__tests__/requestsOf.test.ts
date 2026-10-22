import type { ISuiteChange } from '@/modules/Automation/types';
import { describe, expect, it } from 'vitest';
import { requestsOf } from '@/modules/Automation/library';
import { suiteTest } from './fixtures';

const write = (props: Partial<ISuiteChange>) =>
  ({
    id: 'c-01',
    startedAt: 1,
    status: 'ready',
    ask: { kind: 'write', text: 'A new test', folder: '', source: null },
    ...props,
  }) as ISuiteChange;

describe('requestsOf', () => {
  it('lists the new tests asked for, the latest first', () => {
    expect(
      requestsOf([
        write({ id: 'c-01', startedAt: 1 }),
        write({ id: 'c-02', startedAt: 2 }),
      ]).map(({ id }) => id),
    ).toEqual(['c-02', 'c-01']);
  });

  it('leaves out fixes, and what the QA threw away', () => {
    expect(
      requestsOf([
        write({ status: 'discarded' }),
        {
          ...write({ id: 'c-02' }),
          ask: { kind: 'fix', runId: 's-01', test: suiteTest({}) },
        },
      ]),
    ).toEqual([]);
  });
});
