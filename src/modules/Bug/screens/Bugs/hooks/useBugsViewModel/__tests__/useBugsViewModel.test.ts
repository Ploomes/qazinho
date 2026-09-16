// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeBug } from '@/modules/Bug/library';
import { useBugsViewModel } from '@/modules/Bug/screens/Bugs/hooks/useBugsViewModel';
import { flattenPlanSteps } from '@/modules/Run/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WORKSPACE = makeWorkspace();
const BUG = makeBug({ workspace: WORKSPACE, step: flattenPlanSteps(WORKSPACE.plan)[4]! });

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [{ ...WORKSPACE, bugs: [BUG] }],
    openBugId: null,
    bugFilter: 'all',
  });
});

describe('useBugsViewModel', () => {
  it('counts the bugs in the singular when there is only one', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.summary).toBe('1 bug, caught by the agent');
  });

  it('has nothing to show while nothing has broken', () => {
    useWorkspaceStore.setState({ workspaces: [WORKSPACE] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  describe('onFilter', () => {
    it('keeps the bugs of that severity', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onFilter('high');
      });

      expect(result.current.bugs).toHaveLength(1);
    });

    it('shows none when no bug carries that severity', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onFilter('low');
      });

      expect(result.current.bugs).toEqual([]);
    });
  });

  describe('onToggleBug', () => {
    it('opens a bug and closes it again', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onToggleBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-01');

      act(() => {
        result.current.onToggleBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().openBugId).toBeNull();
    });
  });
});
