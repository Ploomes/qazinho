// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoSweep } from '@/shared/hooks';
import { useSettingsStore } from '@/store';

const sweeps: number[] = [];

beforeEach(() => {
  sweeps.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('qazinho', {
    sweepVideos: (days: number) => {
      sweeps.push(days);

      return Promise.resolve({ removed: 0, freedBytes: 0 });
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useVideoSweep', () => {
  it('lets old run videos go on start, and again every six hours', () => {
    useSettingsStore.setState({ videoKeepDays: 30 });

    renderHook(() => {
      useVideoSweep();
    });
    vi.advanceTimersByTime(6 * 60 * 60 * 1_000);

    expect(sweeps).toEqual([30, 30]);
  });

  it('sweeps nothing for a QA who keeps videos for good', () => {
    useSettingsStore.setState({ videoKeepDays: null });

    renderHook(() => {
      useVideoSweep();
    });
    vi.advanceTimersByTime(24 * 60 * 60 * 1_000);

    expect(sweeps).toEqual([]);
  });
});
