// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScreenRailViewModel } from '@/modules/Device/components/DeviceView/components/ScreenRail/hooks/useScreenRailViewModel';
import { DEVICE } from '@/modules/Device/constants';

const screen = (id: number, isShown = false) => ({
  id,
  streamUrl: `http://127.0.0.1:1/t/w~${String(id)}`,
  isAgent: id === 1,
  isShown,
  tip: `Screen ${String(id)}`,
});

const rail = (screens: ReturnType<typeof screen>[]) =>
  renderHook(() =>
    useScreenRailViewModel({ label: 'Open screens', screens, onPick: vi.fn() }),
  );

describe('useScreenRailViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for a fresh picture of each screen, keeping no stream open', () => {
    const { result } = rail([screen(1), screen(2)]);

    expect(result.current.screens[0]?.picture).toBe('http://127.0.0.1:1/t/w~1?still=0');

    act(() => {
      vi.advanceTimersByTime(DEVICE.railRefreshMs);
    });

    expect(result.current.screens[1]?.picture).toBe('http://127.0.0.1:1/t/w~2?still=1');
  });

  it('marks only the screen the QA is looking at', () => {
    const { result } = rail([screen(1, true), screen(2)]);

    expect(result.current.screens.map(({ className }) => className)).toEqual([
      'screen-rail__screen screen-rail__screen--shown',
      'screen-rail__screen',
    ]);
  });

  it('draws no picture for a screen with no stream', () => {
    const { result } = rail([{ ...screen(1), streamUrl: null as never }]);

    expect(result.current.screens[0]?.picture).toBeNull();
  });
});
