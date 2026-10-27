import type { IProShare } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { isSendingShare } from '@/modules/Pro/library';

const SHARE: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: null,
  pending: [],
  conflicts: [],
};

describe('isSendingShare', () => {
  it('takes what changes in a linked project, waiting or refused included', () => {
    expect(isSendingShare(SHARE)).toBe(true);
    expect(isSendingShare({ ...SHARE, state: 'waiting' })).toBe(true);
    expect(isSendingShare({ ...SHARE, state: 'blocked' })).toBe(true);
  });

  it('does NOT take what changes in a project never linked, or one its org lost', () => {
    expect(isSendingShare({ ...SHARE, orgSlug: null, state: 'off' })).toBe(false);
    expect(isSendingShare({ ...SHARE, state: 'gone' })).toBe(false);
    expect(isSendingShare({ ...SHARE, state: 'no-access' })).toBe(false);
  });
});
