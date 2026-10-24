import { describe, expect, it } from 'vitest';
import { finishedVerdictOf } from '@/modules/Pro/library';

describe('finishedVerdictOf', () => {
  it('keeps a verdict the run reached', () => {
    expect(
      ['passed', 'failed', 'blocked', 'skipped'].map((verdict) =>
        finishedVerdictOf(verdict as never),
      ),
    ).toEqual(['passed', 'failed', 'blocked', 'skipped']);
  });

  it('calls a step that never got past waiting or walking skipped', () => {
    expect(finishedVerdictOf('pending')).toBe('skipped');
    expect(finishedVerdictOf('running')).toBe('skipped');
  });
});
