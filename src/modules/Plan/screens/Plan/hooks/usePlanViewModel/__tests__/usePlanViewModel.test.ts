// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlanViewModel } from '@/modules/Plan/screens/Plan/hooks/usePlanViewModel';
import { startRun } from '@/modules/Workspace';
import {
  CASES,
  makeWorkspace,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], openCaseId: null });
});

describe('usePlanViewModel', () => {
  it('counts the cases and the steps of the plan', () => {
    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.summary).toBe('2 cases · 6 steps');
    expect(result.current.isEmpty).toBe(false);
  });

  it('has nothing to show before the agent drafts', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  it('hands each case the way it went in the newest run', () => {
    useWorkspaceStore.setState({
      workspaces: [
        walkRun({
          verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
          isFinished: true,
        }),
      ],
    });

    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.lastRuns['TC-01']?.verdict).toBe('passed');
    expect(result.current.lastRuns['TC-02']?.steps[1]?.verdict).toBe('failed');
  });

  describe('onReorder', () => {
    it('moves a case where the QA dropped it', () => {
      const { result } = renderHook(() => usePlanViewModel());
      const flipped = [...CASES].reverse();

      act(() => {
        result.current.onReorder(flipped);
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.id).toBe('TC-02');
    });

    it('does NOT let the plan move while the agent is running it', () => {
      useWorkspaceStore.setState({
        workspaces: [
          startRun({ workspace: makeWorkspace(), startedAt: '09:41', runId: 'r-01' }),
        ],
      });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.isLocked).toBe(true);

      act(() => {
        result.current.onReorder([...CASES].reverse());
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.id).toBe('TC-01');
    });
  });
});
