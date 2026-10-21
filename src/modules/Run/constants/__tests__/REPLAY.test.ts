import { describe, expect, it } from 'vitest';
import { REPLAY } from '@/modules/Run/constants';

describe('REPLAY', () => {
  it('starts at normal speed and only ever goes faster', () => {
    expect(REPLAY.rates[0]).toBe(1);
    expect([...REPLAY.rates]).toEqual(
      [...REPLAY.rates].sort((one, other) => one - other),
    );
  });

  it('opens a bug a little before it was caught, and holds a moment after', () => {
    expect(REPLAY.bugLeadMs).toBeGreaterThan(REPLAY.bugTailMs);
  });
});
