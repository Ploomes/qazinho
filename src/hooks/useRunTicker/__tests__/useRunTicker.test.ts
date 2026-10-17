// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunTicker } from '@/hooks/useRunTicker';
import { RUN_CLOCK } from '@/modules/Run';
import { startRun } from '@/modules/Workspace';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useWorkspaceStore } from '@/store';

const TEN_SECONDS = RUN_CLOCK.tickMs * 10;

function elapsed() {
  return useWorkspaceStore.getState().workspaces[0]?.live?.elapsedSec;
}

beforeEach(() => {
  vi.useFakeTimers();
  useWorkspaceStore.setState({
    workspaces: [
      startRun({ workspace: makeWorkspace(), startedAt: '09:41', runId: 'r-01' }),
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRunTicker', () => {
  it('counts the seconds a live run has been going', () => {
    renderHook(() => useRunTicker());

    vi.advanceTimersByTime(TEN_SECONDS);

    expect(elapsed()).toBe(10);
  });

  it('a held run stops counting, because the device is not being worked', () => {
    renderHook(() => useRunTicker());
    const { workspaces } = useWorkspaceStore.getState();
    const held = workspaces[0]!;

    useWorkspaceStore.setState({
      workspaces: [{ ...held, live: { ...held.live!, isRunning: false } }],
    });
    vi.advanceTimersByTime(TEN_SECONDS);

    expect(elapsed()).toBe(0);
  });

  it('stops ticking once the page drops the hook', () => {
    const { unmount } = renderHook(() => useRunTicker());

    unmount();
    vi.advanceTimersByTime(TEN_SECONDS);

    expect(elapsed()).toBe(0);
  });
});
