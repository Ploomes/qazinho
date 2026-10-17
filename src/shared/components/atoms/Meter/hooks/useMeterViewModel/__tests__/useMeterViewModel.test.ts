// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMeterViewModel } from '@/shared/components/atoms/Meter/hooks/useMeterViewModel';

describe('useMeterViewModel', () => {
  it('reads a share of the bar as a percentage', () => {
    const { result } = renderHook(() => useMeterViewModel({ value: 0.34, label: 'CPU' }));

    expect(result.current.percent).toBe('34%');
  });

  it('never runs past the end of the bar, however busy the machine is', () => {
    const { result } = renderHook(() => useMeterViewModel({ value: 4, label: 'CPU' }));

    expect(result.current.percent).toBe('100%');
  });

  it('never runs backwards either', () => {
    const { result } = renderHook(() => useMeterViewModel({ value: -1, label: 'CPU' }));

    expect(result.current.percent).toBe('0%');
  });
});
