import { describe, expect, it } from 'vitest';
import { dayKeyOf } from '@/modules/Home/library';

describe('dayKeyOf', () => {
  it('writes the local day of an instant with two digits for month and day', () => {
    expect(dayKeyOf(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
    expect(dayKeyOf(new Date(2026, 10, 10, 0, 1).getTime())).toBe('2026-11-10');
  });
});
