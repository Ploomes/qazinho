// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from '@/shared/hooks/useCountdown';

beforeEach(() => {
  vi.useFakeTimers({ now: 10_000 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCountdown', () => {
  it('counts the whole seconds left down to zero, and stays there', () => {
    const { result } = renderHook(() => useCountdown(13_000));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1_250);
    });

    expect(result.current).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current).toBe(0);
  });

  it('counts nothing while there is nothing to wait for', () => {
    expect(renderHook(() => useCountdown(null)).result.current).toBeNull();
  });

  it('starts from the moment it is given, not from when it first showed', () => {
    const { result, rerender } = renderHook(({ until }) => useCountdown(until), {
      initialProps: { until: null as number | null },
    });

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    rerender({ until: 17_000 });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe(3);
  });
});
