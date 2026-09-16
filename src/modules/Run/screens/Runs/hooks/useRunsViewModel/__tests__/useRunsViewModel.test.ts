// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunsViewModel } from '@/modules/Run/screens/Runs/hooks/useRunsViewModel';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function finishedWorkspace() {
  return walkRun({
    verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
    isFinished: true,
  });
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

  it('counts every verdict in the order the report shows them, glyph beside each', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(
      result.current.counts.map(({ status, glyph, count }) => [status, glyph, count]),
    ).toEqual([
      ['passed', '✓', 4],
      ['failed', '✕', 1],
      ['blocked', '⊘', 0],
      ['skipped', '–', 1],
    ]);
  });

  it('puts the bug on the step that caught it, instead of the agent note', () => {
    const { result } = renderHook(() => useRunsViewModel());
    const failed = result.current.cases[1]?.steps.find(
      ({ verdict }) => verdict === 'failed',
    );

    expect(failed?.bug?.id).toBe('BUG-01');
    expect(failed?.hasNote).toBe(false);
  });

  it('mutes a step that never ran, and keeps its note', () => {
    const { result } = renderHook(() => useRunsViewModel());
    const skipped = result.current.cases[1]?.steps.find(
      ({ verdict }) => verdict === 'skipped',
    );

    expect(skipped?.isMuted).toBe(true);
    expect(skipped?.hasNote).toBe(true);
  });

  it('does NOT call a case failed when nothing in it failed, even if the saved run says so', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'blocked', 'skipped'],
      isFinished: true,
    });
    const runs = workspace.runs.map((run) => ({
      ...run,
      cases: run.cases.map((runCase) => ({ ...runCase, verdict: 'failed' as const })),
    }));
    useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.cases[1]?.verdict).toBe('blocked');
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
