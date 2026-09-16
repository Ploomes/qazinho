import { formatClock } from '@/modules/Chat/library';
import { describe, expect, it } from 'vitest';

describe('formatClock', () => {
  it('reads a message time as the QA sees it in the gutter', () => {
    expect(formatClock(new Date(2026, 8, 15, 19, 54))).toBe('19:54');
  });

  it('pads the hour and the minute, so the gutter never jumps a character', () => {
    expect(formatClock(new Date(2026, 8, 15, 9, 4))).toBe('09:04');
  });

  it('reads midnight as 00:00, not 24:00', () => {
    expect(formatClock(new Date(2026, 8, 15, 0, 0))).toBe('00:00');
  });
});
