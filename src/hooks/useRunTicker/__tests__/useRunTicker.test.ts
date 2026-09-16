// @vitest-environment jsdom
import { RUN_ENGINE } from '@/modules/Run/constants';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useRunTicker } from '@/hooks/useRunTicker';
import { useWorkspaceStore } from '@/store';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const A_STEP = RUN_ENGINE.tickSeconds * RUN_ENGINE.ticksPerStep * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  useWorkspaceStore.setState({
    workspaces: [startRun({ workspace: makeWorkspace(), startedAt: '09:41' })],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRunTicker', () => {
  it('resolves a step once enough time has passed', () => {
    renderHook(() => useRunTicker());

    vi.advanceTimersByTime(A_STEP);

    expect(useWorkspaceStore.getState().workspaces[0]?.live?.stepIndex).toBe(1);
  });

  it('stops ticking once the page drops the hook', () => {
    const { unmount } = renderHook(() => useRunTicker());

    unmount();
    vi.advanceTimersByTime(A_STEP * 2);

    expect(useWorkspaceStore.getState().workspaces[0]?.live?.stepIndex).toBe(0);
  });
});
