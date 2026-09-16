// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunsViewModel } from '@/modules/Run/screens/Runs/hooks/useRunsViewModel';
import { advanceRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function finishedWorkspace() {
  let workspace = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });

  for (let tick = 0; tick < 18; tick += 1) workspace = advanceRun(workspace);

  return workspace;
}

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [finishedWorkspace()],
    selectedRunId: null,
    runFilter: 'all',
  });
});

describe('useRunsViewModel', () => {
  it('opens on the newest run without being asked', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.run?.id).toBe('r-01');
  });

  it('has nothing to show before the first run', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.run).toBeNull();
  });

  describe('onFilter', () => {
    it('narrows the report to the failures', () => {
      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onFilter('failed');
      });

      expect(result.current.cases).toHaveLength(1);
      expect(result.current.cases[0]?.steps[0]?.verdict).toBe('failed');
    });

    it('shows nothing under a verdict this run never produced', () => {
      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onFilter('blocked');
      });

      expect(result.current.cases).toEqual([]);
    });
  });

  describe('onOpenBug', () => {
    it('hands the QA over to the bug it clicked', () => {
      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onOpenBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().tab).toBe('bugs');
      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-01');
    });
  });
});
