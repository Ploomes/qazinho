// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSidebarFit } from '@/shared/hooks/useSidebarFit';
import { useSettingsStore } from '@/store';

function resizeTo(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const isShut = () => useSettingsStore.getState().isSidebarShut;

beforeEach(() => {
  useSettingsStore.setState({ isSidebarShut: false });
});

afterEach(() => {
  resizeTo(1024);
});

describe('useSidebarFit', () => {
  it('leaves an open sidebar alone in a wide window', () => {
    resizeTo(1440);

    renderHook(() => {
      useSidebarFit();
    });

    expect(isShut()).toBe(false);
  });

  it('folds the sidebar when the window opens narrow', () => {
    resizeTo(1000);

    renderHook(() => {
      useSidebarFit();
    });

    expect(isShut()).toBe(true);
  });

  it('folds it as the window narrows, and opens it again as it widens', () => {
    resizeTo(1440);
    renderHook(() => {
      useSidebarFit();
    });

    act(() => {
      resizeTo(1050);
    });
    expect(isShut()).toBe(true);

    act(() => {
      resizeTo(1300);
    });
    expect(isShut()).toBe(false);
  });

  it('keeps a sidebar the QA folded by hand folded when the window widens', () => {
    resizeTo(1440);
    useSettingsStore.setState({ isSidebarShut: true });
    renderHook(() => {
      useSidebarFit();
    });

    act(() => {
      resizeTo(1000);
    });
    act(() => {
      resizeTo(1400);
    });

    expect(isShut()).toBe(true);
  });

  it('lets the QA open the sidebar again in a narrow window', () => {
    resizeTo(1000);
    renderHook(() => {
      useSidebarFit();
    });

    act(() => {
      useSettingsStore.getState().toggleSidebar();
    });

    expect(isShut()).toBe(false);
  });
});
