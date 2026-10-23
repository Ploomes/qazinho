// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTooltipViewModel } from '@/shared/components/molecules/Tooltip/hooks/useTooltipViewModel';

describe('useTooltipViewModel', () => {
  it('stays hidden until the pointer or the focus arrives', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.isOpen).toBe(false);
  });

  it('wraps a long tip at a width it never grows past', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.style).toEqual({ '--tooltip-max': '300px' });
  });

  it('opens on arrival and closes on leaving', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('does NOT open while it is off', () => {
    const { result } = renderHook(() => useTooltipViewModel({ isOff: true }));

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(false);
  });

  /** In the folded sidebar a tip under its row was cut by the rail's own edge. */
  it('opens beside what it names, centred on it, a little gap away', () => {
    const { result } = renderHook(() => useTooltipViewModel({ side: 'right' }));

    (result.current.anchorRef as { current: unknown }).current = {
      getBoundingClientRect: () => ({ top: 100, height: 40, right: 56 }),
    };

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isBeside).toBe(true);
    expect(result.current.panelClassName).toBe('tooltip__panel tooltip__panel--beside');
    expect(result.current.style).toMatchObject({
      '--tooltip-top': '120px',
      '--tooltip-left': '66px',
    });
  });

  /** The fold button sits at the window's foot, and its tip, centred on it, hung half past the edge. */
  it('keeps a tip beside something at the window foot inside the window', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    const { result } = renderHook(() => useTooltipViewModel({ side: 'right' }));

    (result.current.anchorRef as { current: unknown }).current = {
      getBoundingClientRect: () => ({ top: 870, height: 28, right: 56 }),
    };

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.style).toMatchObject({ '--tooltip-top': '868px' });
  });

  it('opens under what it names unless asked to sit beside it', () => {
    const { result } = renderHook(() => useTooltipViewModel({}));

    expect(result.current.isBeside).toBe(false);
    expect(result.current.panelClassName).toBe('tooltip__panel');
  });
});
