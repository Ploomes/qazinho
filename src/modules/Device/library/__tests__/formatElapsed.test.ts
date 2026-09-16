import { describe, expect, it } from 'vitest';
import { formatElapsed } from '@/modules/Device/library';

describe('formatElapsed', () => {
  it('reads the first seconds of a run', () => {
    expect(formatElapsed(7)).toBe('0:07');
  });

  it('pads the seconds, so the badge never jumps a character', () => {
    expect(formatElapsed(65)).toBe('1:05');
  });

  it('drops the half second the engine counts in', () => {
    expect(formatElapsed(12.5)).toBe('0:12');
  });
});
