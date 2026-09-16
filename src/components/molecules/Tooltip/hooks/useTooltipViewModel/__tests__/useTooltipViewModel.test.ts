// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTooltipViewModel } from '@/components/molecules/Tooltip/hooks/useTooltipViewModel';

describe('useTooltipViewModel', () => {
  it('stays hidden until the pointer or the focus arrives', () => {
    const { result } = renderHook(() => useTooltipViewModel());

    expect(result.current.isOpen).toBe(false);
  });

  it('opens on arrival and closes on leaving', () => {
    const { result } = renderHook(() => useTooltipViewModel());

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
