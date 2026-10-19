// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';

function resizeTo(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  resizeTo(1024);
});

describe('useWindowWidth', () => {
  it('starts at the width the window has', () => {
    resizeTo(1440);

    expect(renderHook(() => useWindowWidth()).result.current).toBe(1440);
  });

  it('follows the window as the QA resizes it', () => {
    resizeTo(1440);

    const { result } = renderHook(() => useWindowWidth());

    act(() => {
      resizeTo(1100);
    });

    expect(result.current).toBe(1100);
  });

  it('does NOT follow the window once the component is gone', () => {
    resizeTo(1440);

    const { result, unmount } = renderHook(() => useWindowWidth());

    unmount();
    resizeTo(900);

    expect(result.current).toBe(1440);
  });
});
