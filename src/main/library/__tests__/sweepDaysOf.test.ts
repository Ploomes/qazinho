import { describe, expect, it } from 'vitest';
import { sweepDaysOf } from '@/main/library';

describe('sweepDaysOf', () => {
  it('takes a whole number of days, from one to ten years', () => {
    expect(sweepDaysOf(1)).toBe(1);
    expect(sweepDaysOf(30)).toBe(30);
    expect(sweepDaysOf(3650)).toBe(3650);
  });

  it('takes nothing else the page could send, so no sweep runs on a wrong number', () => {
    expect(sweepDaysOf(0)).toBeNull();
    expect(sweepDaysOf(-7)).toBeNull();
    expect(sweepDaysOf(1.5)).toBeNull();
    expect(sweepDaysOf(3651)).toBeNull();
    expect(sweepDaysOf('30')).toBeNull();
    expect(sweepDaysOf(null)).toBeNull();
  });
});
