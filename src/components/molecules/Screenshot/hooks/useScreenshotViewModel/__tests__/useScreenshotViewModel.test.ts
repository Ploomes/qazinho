// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useScreenshotViewModel } from '@/components/molecules/Screenshot/hooks/useScreenshotViewModel';

describe('useScreenshotViewModel', () => {
  it('is the small thumbnail of a step by default', () => {
    const { result } = renderHook(() => useScreenshotViewModel({ label: 'step 3' }));

    expect(result.current.className).toBe('screenshot screenshot--thumb');
    expect(result.current.pitch).toBe(6);
  });

  it('marks the shot that shows the failure, so the eye lands on it', () => {
    const { result } = renderHook(() =>
      useScreenshotViewModel({ label: 'payment', isBad: true, size: 'shot' }),
    );

    expect(result.current.className).toBe('screenshot screenshot--shot screenshot--bad');
  });

  it('opens the lightbox when it has somewhere to open', () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useScreenshotViewModel({ label: 'step 3', onOpen }),
    );

    result.current.onScreenshotClick();

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('does nothing when there is nothing to open', () => {
    const { result } = renderHook(() => useScreenshotViewModel({ label: 'step 3' }));

    expect(() => result.current.onScreenshotClick()).not.toThrow();
  });
});
