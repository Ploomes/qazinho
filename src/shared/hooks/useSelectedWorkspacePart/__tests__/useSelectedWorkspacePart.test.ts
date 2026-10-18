// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [
      startRun({ workspace: makeWorkspace(), startedAt: '09:41', runId: 'r-01' }),
    ],
  });
});

function counted() {
  const renders = { count: 0 };
  const view = renderHook(() => {
    renders.count += 1;

    return useSelectedWorkspacePart((workspace) => ({
      name: workspace.name,
      plan: workspace.plan,
    }));
  });

  return { renders, view };
}

describe('useSelectedWorkspacePart', () => {
  it('hands over the parts of the open workspace it was asked for', () => {
    expect(counted().view.result.current).toEqual({
      name: 'Checkout regression',
      plan: makeWorkspace().plan,
    });
  });

  /**
   * A run's clock moves the open workspace every second. A view that does not show the clock
   * reads only its own parts, and sits still while the run goes.
   */
  it('does NOT render again when a part it does not read changes', () => {
    const { renders } = counted();

    act(() => {
      useWorkspaceStore.getState().tickClock();
      useWorkspaceStore.getState().tickClock();
    });

    expect(renders.count).toBe(1);
  });

  it('renders again when a part it reads changes', () => {
    const { renders, view } = counted();

    act(() => {
      useWorkspaceStore
        .getState()
        .renameWorkspace({ workspaceId: 'w1', name: 'Renamed' });
    });

    expect(renders.count).toBe(2);
    expect(view.result.current?.name).toBe('Renamed');
  });

  it('has nothing while no workspace is open', () => {
    useAppStore.setState({ selectedWorkspaceId: null });

    expect(counted().view.result.current).toBeNull();
  });
});
