// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useBugsViewModel } from '@/modules/Bug/screens/Bugs/hooks/useBugsViewModel';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [{ ...WORKSPACE, bugs: [BUG] }],
    openBugId: null,
    bugFilter: 'all',
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useBugsViewModel', () => {
  it('counts the bugs in the singular when there is only one', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.summary).toBe('1 bug, caught by the agent');
  });

  it('has nothing to show while nothing has broken', () => {
    useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, bugs: [] }] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  describe('onFilter', () => {
    it('offers every severity by name, with the one in use marked', async () => {
      await i18n.changeLanguage('pt');

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.filters).toEqual([
        { id: 'all', label: 'todos', isActive: true },
        { id: 'high', label: 'alta', isActive: false },
        { id: 'medium', label: 'média', isActive: false },
        { id: 'low', label: 'baixa', isActive: false },
      ]);
    });

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

  describe('onOpenRun', () => {
    it('opens the Runs tab on the run the bug was caught in', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenRun('r-01');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        tab: 'runs',
        selectedRunId: 'r-01',
      });
    });

    /**
     * Before runs that ended early were kept, a stopped run left its bugs pointing at nothing,
     * and those bugs are still on disk.
     */
    it('does NOT offer a run that is not there', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [BUG], runs: [] }],
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.bugs[0]?.hasRun).toBe(false);
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

  it("places a bug in its run's video, a moment that the card can show", () => {
    useWorkspaceStore.setState({ workspaces: [recordedRun()] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.bugs[0]?.moment).toEqual({
      workspaceId: 'w1',
      runId: 'r-01',
      atMs: 9_500,
    });
  });

  it('has no moment to show for a bug whose run has no video', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.bugs[0]?.moment).toBeNull();
  });
});
