// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useRunsViewModel } from '@/modules/Run/screens/Runs/hooks/useRunsViewModel';
import { endRun, landCost } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  recordedRun,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
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

  it('names the run and what it walked in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.title).toBe('Run r-01 · o plano inteiro');
    expect(result.current.runs[0]?.what).toBe('O plano inteiro');
    await i18n.changeLanguage('en');
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

    expect(result.current.runEnded).toEqual({ icon: 'stop', label: 'stopped' });
    expect(result.current.runs[0]?.ended).toEqual({ icon: 'stop', label: 'stopped' });
  });

  it('has nothing to show before the first run', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.run).toBeNull();
  });

  it('counts every verdict in the order the report shows them, icon beside each', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(
      result.current.counts.map(({ status, icon, count }) => [status, icon, count]),
    ).toEqual([
      ['passed', 'check', 4],
      ['failed', 'close', 1],
      ['blocked', 'blocked', 0],
      ['skipped', 'skip', 1],
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

  it('marks a case walked again without the agent, and says what it checked on screen', () => {
    const replayed = finishedWorkspace();
    const [run] = replayed.runs;

    if (run === undefined) throw new Error('fixture');

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...replayed,
          runs: [
            {
              ...run,
              cases: run.cases.map((runCase, position) => ({
                ...runCase,
                steps: runCase.steps.map((step) =>
                  position === 0
                    ? { ...step, by: 'replay' as const, proof: 'Visits: 1', why: null }
                    : { ...step, by: 'healed' as const },
                ),
              })),
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useRunsViewModel());
    const [first, second] = result.current.cases;

    expect(first?.walk).toMatchObject({
      label: 'no AI',
      className: 'runs__walk runs__walk--replay',
    });
    expect(first?.steps[0]).toMatchObject({
      hasNote: true,
      note: 'checked on screen: “Visits: 1”',
    });
    expect(second?.walk).toMatchObject({ label: 'healed' });
  });

  it('does NOT mark a case the agent walked on its own', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.cases.map(({ walk }) => walk)).toEqual([null, null]);
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

    it('counts every run for the picker, not only the page in its list', () => {
      manyRuns(12);

      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.runs).toHaveLength(5);
      expect(result.current.runTotal).toBe(12);
    });
  });

  describe('current', () => {
    it('puts the run on show at the top, with how long it took and what it cost', () => {
      const paid = landCost({
        workspace: walkRun({ verdicts: ['passed'] }),
        costUsd: 0.25,
      });

      useWorkspaceStore.setState({
        workspaces: [endRun({ workspace: paid, at: '09:42', endedBy: 'finished' })],
      });

      expect(renderHook(() => useRunsViewModel()).result.current.current).toMatchObject({
        id: 'r-01',
        isSelected: true,
        facts: '0:00 · $0.25',
      });
    });
  });

  describe('onToTop', () => {
    it('does NOT offer the way back up while the picker is in view', () => {
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      expect(renderHook(() => useRunsViewModel()).result.current.showsToTop).toBe(false);
    });
  });

  describe('onWatch', () => {
    it('offers to watch a run that was recorded, and opens it whole', () => {
      useWorkspaceStore.setState({ workspaces: [recordedRun()] });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.canWatch).toBe(true);
      expect(result.current.watchLabel).toBe('Watch the run');

      act(() => {
        result.current.onWatch();
      });

      expect(useAppStore.getState().replay).toEqual({
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'run' },
      });
      useAppStore.setState({ replay: null });
    });

    it('does NOT offer to watch a run that has no video', () => {
      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.canWatch).toBe(false);
      expect(result.current.cases.every(({ take }) => take === null)).toBe(true);
    });
  });

  describe('take', () => {
    it("opens a case's own take from the case", () => {
      useWorkspaceStore.setState({ workspaces: [recordedRun()] });

      const { result } = renderHook(() => useRunsViewModel());
      const take = result.current.cases[1]?.take;

      expect(take?.title).toBe('Watch the take of TC-02');

      act(() => {
        take?.onClick();
      });

      expect(useAppStore.getState().replay?.focus).toEqual({
        kind: 'case',
        caseId: 'TC-02',
      });
      useAppStore.setState({ replay: null });
    });
  });
});
