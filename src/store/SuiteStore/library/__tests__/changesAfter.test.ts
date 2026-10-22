import type { ISuiteChange } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { changesAfter } from '@/store/SuiteStore/library';

const change = (props: Partial<ISuiteChange>) =>
  ({ id: 'c-01', startedAt: 1, ...props }) as ISuiteChange;

describe('changesAfter', () => {
  it('puts a change where it was, as it now stands', () => {
    expect(
      changesAfter({
        changes: [change({ status: 'working' })],
        change: change({ status: 'ready' }),
      }),
    ).toEqual([change({ status: 'ready' })]);
  });

  it('adds a new change, the latest first', () => {
    expect(
      changesAfter({
        changes: [change({ id: 'c-01', startedAt: 1 })],
        change: change({ id: 'c-02', startedAt: 2 }),
      }).map(({ id }) => id),
    ).toEqual(['c-02', 'c-01']);
  });
});
