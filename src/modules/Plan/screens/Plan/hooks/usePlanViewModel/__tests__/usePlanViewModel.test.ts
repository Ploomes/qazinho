// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlanViewModel } from '@/modules/Plan/screens/Plan/hooks/usePlanViewModel';
import { startRun } from '@/modules/Workspace';
import {
  CASES,
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

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

  it('counts one case of one step in the singular', () => {
    const plan = makeWorkspace()
      .plan.slice(0, 1)
      .map((testCase) => ({
        ...testCase,
        steps: testCase.steps.slice(0, 1),
      }));

    useWorkspaceStore.setState({ workspaces: [makeWorkspace(plan)] });

    expect(renderHook(() => usePlanViewModel()).result.current.summary).toBe(
      '1 case · 1 step',
    );
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

  describe('onRemoveCase', () => {
    const ids = () =>
      useWorkspaceStore.getState().workspaces[0]?.plan.map(({ id }) => id);

    it('takes the case out and offers to bring it back, naming it', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      expect(ids()).toEqual(['TC-02']);
      expect(result.current.undo).toMatchObject({
        text: 'TC-01 removed from the plan',
        actionLabel: 'Undo',
      });
    });

    it('offers only the newest removal, under a key of its own', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      const first = result.current.undo?.key;

      act(() => {
        result.current.onRemoveCase('TC-02');
      });

      expect(result.current.undo?.text).toBe('TC-02 removed from the plan');
      expect(result.current.undo?.key).not.toBe(first);
      expect(result.current.isEmpty).toBe(true);
    });

    it('does NOT take a case out of a plan the agent is running', () => {
      useWorkspaceStore.setState({
        workspaces: [
          startRun({
            workspace: makeWorkspace(),
            startedAt: '09:41',
            runId: 'r-01',
            by: WALKED_BY,
          }),
        ],
      });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      expect(ids()).toEqual(['TC-01', 'TC-02']);
      expect(result.current.undo).toBeNull();
    });
  });

  describe('onUndo', () => {
    const ids = () =>
      useWorkspaceStore.getState().workspaces[0]?.plan.map(({ id }) => id);

    it('puts the plan back as it was, the case in its place', () => {
      const before = useWorkspaceStore.getState().workspaces[0]?.plan;
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onUndo();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toBe(before);
      expect(result.current.undo).toBeNull();
    });

    it('brings back the newest removal only', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onRemoveCase('TC-02');
      });
      act(() => {
        result.current.onUndo();
      });

      expect(ids()).toEqual(['TC-02']);
    });

    /**
     * Undo puts back the whole plan from before the removal, so it would also wipe whatever
     * changed since: the offer goes the moment the plan moves on.
     */
    it('does NOT bring the case back once the plan changed after the removal', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onAddCase();
      });

      expect(result.current.undo).toBeNull();

      act(() => {
        result.current.onUndo();
      });

      expect(ids()).not.toContain('TC-01');
      expect(ids()).toHaveLength(2);
    });

    it('does NOT bring it back into a plan a run has locked since', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      const removed = useWorkspaceStore.getState().workspaces[0]!;

      act(() => {
        useWorkspaceStore.setState({
          workspaces: [
            startRun({
              workspace: removed,
              startedAt: '09:41',
              runId: 'r-01',
              by: WALKED_BY,
            }),
          ],
        });
      });

      expect(result.current.undo).toBeNull();
    });

    it('lets the removal stand once its time ran out', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onUndoExpire();
      });

      expect(result.current.undo).toBeNull();

      act(() => {
        result.current.onUndo();
      });

      expect(ids()).toEqual(['TC-02']);
    });

    it("does NOT offer one workspace's removal in another", () => {
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2' }],
      });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        useAppStore.setState({ selectedWorkspaceId: 'w2' });
      });

      expect(result.current.undo).toBeNull();
    });
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
          startRun({
            workspace: makeWorkspace(),
            startedAt: '09:41',
            runId: 'r-01',
            by: WALKED_BY,
          }),
        ],
      });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.isLocked).toBe(true);

      act(() => {
        result.current.onReorder([...CASES].reverse());
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.id).toBe('TC-01');
    });

    /**
     * A paused run unlocked the plan, but main walks the steps it started with: a case changed
     * or removed while paused came back from the run under the wrong title, or not at all.
     */
    it('does NOT let the plan change while the run is paused either', () => {
      const started = startRun({
        workspace: makeWorkspace(),
        startedAt: '09:41',
        runId: 'r-01',
        by: WALKED_BY,
      });

      useWorkspaceStore.setState({
        workspaces: [{ ...started, live: { ...started.live!, isRunning: false } }],
      });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.isLocked).toBe(true);
    });

    it('names the agent that is running the plan', () => {
      useSettingsStore.setState({ agent: 'Codex' });
      useWorkspaceStore.setState({
        workspaces: [
          startRun({
            workspace: makeWorkspace(),
            startedAt: '09:41',
            runId: 'r-01',
            by: WALKED_BY,
          }),
        ],
      });

      expect(renderHook(() => usePlanViewModel()).result.current.lockedLabel).toBe(
        'Codex is running this plan. Stop the run if you want to change it.',
      );
      useSettingsStore.setState({ agent: 'Claude Code' });
    });
  });
});
