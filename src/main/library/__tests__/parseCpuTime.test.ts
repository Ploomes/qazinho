import { describe, expect, it } from 'vitest';
import { parseCpuTime } from '@/main/library';

describe('parseCpuTime', () => {
  it('reads minutes and seconds, the way macOS prints them', () => {
    expect(parseCpuTime('9:57.13')).toBeCloseTo(597.13);
  });

  it('reads hours and days when a process has run that long', () => {
    expect(parseCpuTime('01:02:03')).toBe(3723);
    expect(parseCpuTime('2-00:00:01')).toBe(172_801);
  });

  it('counts a field it cannot read as no time at all', () => {
    expect(parseCpuTime('nope')).toBe(0);
  });
});
