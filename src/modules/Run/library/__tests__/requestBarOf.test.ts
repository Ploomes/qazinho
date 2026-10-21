import { describe, expect, it } from 'vitest';
import { NETWORK } from '@/modules/Run/constants';
import { requestBarOf } from '@/modules/Run/library';

describe('requestBarOf', () => {
  it('fills a bar a decade at a time', () => {
    expect(requestBarOf(9)).toBeCloseTo(0.25);
    expect(requestBarOf(99)).toBeCloseTo(0.5);
    expect(requestBarOf(999)).toBeCloseTo(0.75);
  });

  it('fills the whole bar from ten seconds on, never past it', () => {
    expect(requestBarOf(9_999)).toBeCloseTo(1);
    expect(requestBarOf(120_000)).toBe(1);
  });

  it('still shows a sliver for a request that took no time', () => {
    expect(requestBarOf(0)).toBe(NETWORK.barFloor);
    expect(requestBarOf(-5)).toBe(NETWORK.barFloor);
  });
});
