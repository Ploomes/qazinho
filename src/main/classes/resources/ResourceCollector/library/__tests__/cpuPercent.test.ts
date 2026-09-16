import { describe, expect, it } from 'vitest';
import { cpuPercent } from '@/main/classes/resources/ResourceCollector/library';

describe('cpuPercent', () => {
  it('spreads the cpu time used over the interval and every core', () => {
    expect(cpuPercent({ before: 10, after: 12, elapsedMs: 4_000, cores: 4 })).toBe(12.5);
  });

  it('reads a whole machine busy as a hundred, never more', () => {
    expect(cpuPercent({ before: 0, after: 8, elapsedMs: 1_000, cores: 8 })).toBe(100);
  });

  it('does NOT guess for a process it has not seen before', () => {
    expect(cpuPercent({ before: undefined, after: 50, elapsedMs: 3_000, cores: 8 })).toBe(
      0,
    );
  });

  it('reads no time passed, or a restarted process, as idle', () => {
    expect(cpuPercent({ before: 5, after: 6, elapsedMs: 0, cores: 8 })).toBe(0);
    expect(cpuPercent({ before: 9, after: 1, elapsedMs: 3_000, cores: 8 })).toBe(0);
  });
});
