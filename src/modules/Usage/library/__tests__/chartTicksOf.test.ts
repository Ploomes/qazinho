import { describe, expect, it } from 'vitest';
import { chartTicksOf } from '@/modules/Usage/library';

describe('chartTicksOf', () => {
  it('goes from zero past the highest value in round steps', () => {
    expect(chartTicksOf({ max: 17, count: 4 })).toEqual([0, 5, 10, 15, 20]);
    expect(chartTicksOf({ max: 23.4, count: 3 })).toEqual([0, 10, 20, 30]);
    expect(chartTicksOf({ max: 0.07, count: 4 })).toEqual([0, 0.02, 0.04, 0.06, 0.08]);
    expect(chartTicksOf({ max: 3_560_000, count: 4 })).toEqual([
      0, 1_000_000, 2_000_000, 3_000_000, 4_000_000,
    ]);
  });

  it('draws an empty axis from 0 to 1', () => {
    expect(chartTicksOf({ max: 0, count: 4 })).toEqual([0, 1]);
  });
});
