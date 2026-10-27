import type { IProShare } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { withShare } from '@/store/ProStore/library';

const SHARED: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: '2026-10-24T12:00:00.000Z',
  pending: [],
  conflicts: [],
};

describe('withShare', () => {
  it('replaces a project’s share where it stands', () => {
    const other = { ...SHARED, projectId: 'p2' };

    expect(
      withShare({ shares: [SHARED, other], share: { ...SHARED, state: 'sending' } }),
    ).toEqual([{ ...SHARED, state: 'sending' }, other]);
  });

  it('adds a project shared for the first time at the end', () => {
    const other = { ...SHARED, projectId: 'p2' };

    expect(withShare({ shares: [SHARED], share: other })).toEqual([SHARED, other]);
  });

  it('takes out a project no longer shared', () => {
    expect(
      withShare({ shares: [SHARED], share: { ...SHARED, orgSlug: null, state: 'off' } }),
    ).toEqual([]);
  });
});
