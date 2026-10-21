import { describe, expect, it } from 'vitest';
import { formatClock } from '@/modules/Run/library';

describe('formatClock', () => {
  it('says a moment as minutes, seconds and a tenth', () => {
    expect(formatClock(12_480)).toBe('0:12.4');
    expect(formatClock(125_000)).toBe('2:05.0');
  });

  it('rounds down, so a moment never reads later than it is', () => {
    expect(formatClock(59_999)).toBe('0:59.9');
  });

  it('starts at zero', () => {
    expect(formatClock(0)).toBe('0:00.0');
    expect(formatClock(-300)).toBe('0:00.0');
  });
});
