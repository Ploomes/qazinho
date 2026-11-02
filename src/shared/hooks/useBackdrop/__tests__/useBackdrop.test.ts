// @vitest-environment jsdom
import type { PointerEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBackdrop } from '@/shared/hooks/useBackdrop';

const backdrop = document.createElement('div');
const panel = document.createElement('div');

const pressedOn = (target: HTMLElement) =>
  ({ target, currentTarget: backdrop }) as unknown as PointerEvent<HTMLElement>;

describe('useBackdrop', () => {
  it('closes when the press and the click both land on the backdrop', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBackdrop(onClose));

    result.current.onPointerDown(pressedOn(backdrop));
    result.current.onClick();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when the press started inside the panel and the drag ended outside', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBackdrop(onClose));

    result.current.onPointerDown(pressedOn(panel));
    result.current.onClick();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT close on a click that came with no press on the backdrop', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBackdrop(onClose));

    result.current.onClick();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('forgets the press once the click is over, so one press closes only once', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBackdrop(onClose));

    result.current.onPointerDown(pressedOn(backdrop));
    result.current.onClick();
    result.current.onClick();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
