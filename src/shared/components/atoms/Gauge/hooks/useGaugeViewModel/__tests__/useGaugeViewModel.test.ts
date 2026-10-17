// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GAUGE } from '@/shared/components/atoms/Gauge/constants';
import { useGaugeViewModel } from '@/shared/components/atoms/Gauge/hooks/useGaugeViewModel';

function ring(value: number) {
  return renderHook(() => useGaugeViewModel({ value, label: 'session' })).result.current;
}

describe('useGaugeViewModel', () => {
  it('a full window draws the whole ring', () => {
    expect(ring(1).offset).toBe(0);
  });

  it('a spent window draws none of it', () => {
    expect(ring(0).offset).toBe(GAUGE.circumference);
  });

  it('half left draws half the ring', () => {
    expect(ring(0.5).offset).toBeCloseTo(GAUGE.circumference / 2);
  });

  it('reads easy while there is room', () => {
    expect(ring(0.6).className).toContain('--easy');
  });

  it('reads tight once a quarter is left', () => {
    expect(ring(0.25).className).toContain('--tight');
  });

  it('reads empty once a tenth is left', () => {
    expect(ring(0.08).className).toContain('--empty');
  });

  it('a number outside the window is pulled back into it', () => {
    expect(ring(2).left).toBe(1);
    expect(ring(-1).left).toBe(0);
  });

  describe('filling with what is used', () => {
    function used(value: number) {
      return renderHook(() =>
        useGaugeViewModel({ value, label: 'context', fills: 'used' }),
      ).result.current;
    }

    it('a full context window closes the ring', () => {
      expect(used(1).offset).toBe(0);
    });

    it('an empty context window leaves the ring open', () => {
      expect(used(0).offset).toBe(GAUGE.circumference);
    });

    it('turns red as the window fills up, not as it empties', () => {
      expect(used(0.2).className).toContain('--easy');
      expect(used(0.8).className).toContain('--tight');
      expect(used(0.95).className).toContain('--empty');
    });
  });
});
