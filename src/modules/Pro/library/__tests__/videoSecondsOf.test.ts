import { describe, expect, it } from 'vitest';
import { videoSecondsOf } from '@/modules/Pro/library';

describe('videoSecondsOf', () => {
  it('places a moment in seconds from when the video began, to the hundredth', () => {
    expect(videoSecondsOf({ at: 1_760_000_012_346, startedAt: 1_760_000_000_000 })).toBe(
      12.35,
    );
  });

  it('places a moment from before the video began at its start', () => {
    expect(videoSecondsOf({ at: 1_759_999_999_500, startedAt: 1_760_000_000_000 })).toBe(
      0,
    );
  });
});
