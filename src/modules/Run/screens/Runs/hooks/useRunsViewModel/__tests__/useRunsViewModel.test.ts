// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunsViewModel } from '@/modules/Run/screens/Runs/hooks/useRunsViewModel';
import { endRun } from '@/modules/Workspace/library';
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

  it('marks a run that ended before the end, and leaves a finished one plain', () => {
    const stopped = endRun({
      workspace: walkRun({ verdicts: ['passed', 'failed'] }),
      at: '09:43',
      endedBy: 'stopped',
    });

    expect(renderHook(() => useRunsViewModel()).result.current.runEnded).toBeNull();

    useWorkspaceStore.setState({ workspaces: [stopped] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.runEnded).toEqual({ glyph: '■', label: 'stopped' });
    expect(result.current.runs[0]?.ended).toEqual({ glyph: '■', label: 'stopped' });
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

  describe('onSelectRun', () => {
    it('opens the run it was given, with every case back in view', () => {
      const workspace = finishedWorkspace();
      const [first] = workspace.runs;
      const runs = [{ ...first!, id: 'r-02' }, first!];

      useWorkspaceStore.setState({
        workspaces: [{ ...workspace, runs }],
        runFilter: 'failed',
      });

      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onSelectRun('r-01');
      });

      expect(result.current.run?.id).toBe('r-01');
      expect(result.current.filter).toBe('all');
    });
  });

  describe('onNextPage', () => {
    function manyRuns(count: number) {
      const workspace = finishedWorkspace();
      const [first] = workspace.runs;
      const runs = Array.from({ length: count }, (_, index) => ({
        ...first!,
        id: `r-${String(count - index).padStart(2, '0')}`,
      }));

      useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });
    }

    it('pages the history five runs at a time, newest first', () => {
      manyRuns(12);

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.runs.map(({ id }) => id)).toEqual([
        'r-12',
        'r-11',
        'r-10',
        'r-09',
        'r-08',
      ]);
      expect(result.current.pager).toMatchObject({
        isShown: true,
        label: '1–5 of 12 runs',
        canGoBack: false,
        canGoOn: true,
      });

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.runs[0]?.id).toBe('r-07');
      expect(result.current.pager.canGoBack).toBe(true);
    });

    it('does NOT show a pager while every run fits on one page', () => {
      manyRuns(3);

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.pager.isShown).toBe(false);
    });
  });
});
