import { describe, expect, it } from 'vitest';
import { BUG_FLASH } from '@/modules/Device/constants';
import { bugFlashHoldOf } from '@/modules/Device/library';

describe('how long a caught bug stays on the screen', () => {
  it('gives a short title the plain time', () => {
    expect(bugFlashHoldOf({ title: '', waiting: 0 })).toBe(BUG_FLASH.holdMs);
  });

  it('gives a longer title the time to be read', () => {
    expect(bugFlashHoldOf({ title: 'x'.repeat(40), waiting: 0 })).toBe(
      BUG_FLASH.holdMs + 40 * BUG_FLASH.perLetterMs,
    );
  });

  it('never holds the run hostage to a very long title', () => {
    expect(bugFlashHoldOf({ title: 'x'.repeat(5_000), waiting: 0 })).toBe(
      BUG_FLASH.holdMs + BUG_FLASH.longestExtraMs,
    );
  });

  it('goes quicker with others waiting their turn', () => {
    expect(
      bugFlashHoldOf({ title: 'x'.repeat(40), waiting: BUG_FLASH.busyWaiting }),
    ).toBe(BUG_FLASH.busyHoldMs);
    expect(bugFlashHoldOf({ title: '', waiting: BUG_FLASH.busyWaiting - 1 })).toBe(
      BUG_FLASH.holdMs,
    );
  });

  it('goes quicker once the run has caught a few', () => {
    expect(bugFlashHoldOf({ title: 'x'.repeat(40), waiting: 0, isQuiet: true })).toBe(
      BUG_FLASH.quietHoldMs,
    );
  });

  it('gives the time to see what is marked on the picture', () => {
    expect(bugFlashHoldOf({ title: '', waiting: 0, hasFocus: true })).toBe(
      BUG_FLASH.holdMs + BUG_FLASH.focusExtraMs,
    );
  });
});
