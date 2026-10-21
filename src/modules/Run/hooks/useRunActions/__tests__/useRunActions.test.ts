// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunActions } from '@/modules/Run/hooks/useRunActions';
import { startRun } from '@/modules/Workspace';
import {
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

function bridge() {
  const startRunCall = vi.fn(() => Promise.resolve());
  const stopRunCall = vi.fn(() => Promise.resolve());

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    startRun: startRunCall,
    stopRun: stopRunCall,
  };

  return { startRunCall, stopRunCall };
}

beforeEach(() => {
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useRunActions', () => {
  describe('onRun', () => {
    it('runs the plan of the workspace open when it is called', () => {
      const { startRunCall } = bridge();
      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onRun();
      });

      expect(startRunCall).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'w1',
          runId: 'r-01',
          target: { kind: 'web', value: 'https://shop.test' },
          mode: 'replay',
        }),
      );
      expect(useWorkspaceStore.getState().workspaces[0]?.live?.isDone).toBe(false);
    });

    /** The run used to start blank, and its agents filed again the bugs the Bugs tab already had. */
    it('tells the run the bugs already open, so its agents count one seen again', () => {
      const { startRunCall } = bridge();
      const walked = walkRun({
        workspace: { ...makeWorkspace(), id: 'w1' },
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
        isFinished: true,
      });

      useWorkspaceStore.setState({ workspaces: [walked] });

      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onRun();
      });

      expect(startRunCall).toHaveBeenCalledWith(
        expect.objectContaining({
          bugs: [
            {
              id: 'BUG-01',
              title: 'Nothing happens on submit',
              caseId: 'TC-02',
              stepNumber: 2,
              isIncidental: false,
            },
          ],
        }),
      );
    });

    it('walks every case with the agent when the QA asks for it', () => {
      const { startRunCall } = bridge();
      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onRunWithAgent();
      });

      expect(startRunCall).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'agent' }),
      );
    });

    it('remembers who walks the run, so what it finds keeps their names when the QA switches later', () => {
      bridge();
      useSettingsStore.setState({ agent: 'Claude Code', model: 'opus' });

      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onRun();
      });
      useSettingsStore.setState({ model: 'haiku' });

      expect(useWorkspaceStore.getState().workspaces[0]?.live?.by).toEqual({
        agent: 'Claude Code',
        modelName: 'Opus',
        targetKind: 'web',
      });
    });

    it('does NOT start a second run while one is going', () => {
      const { startRunCall } = bridge();

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

      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onRun();
      });

      expect(startRunCall).not.toHaveBeenCalled();
    });
  });

  describe('onStop', () => {
    it('stops the run that is going, and leaves a workspace with none alone', () => {
      const { stopRunCall } = bridge();
      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.onStop();
      });

      expect(stopRunCall).not.toHaveBeenCalled();

      act(() => {
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
      });
      act(() => {
        result.current.onStop();
      });

      expect(stopRunCall).toHaveBeenCalledWith('w1');
    });
  });

  describe('runWorkspace', () => {
    it('runs a workspace that is not the one open, and says the run it started', () => {
      const { startRunCall } = bridge();

      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2', name: 'Login' }],
      });

      const { result } = renderHook(() => useRunActions());
      let runId: string | null = null;

      act(() => {
        runId = result.current.runWorkspace('w2');
      });

      expect(runId).toBe('r-01');
      expect(startRunCall).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'w2' }),
      );
    });

    it('starts nothing, and says so, for a workspace with no plan or one that is not there', () => {
      const { startRunCall } = bridge();

      useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

      const { result } = renderHook(() => useRunActions());

      expect(result.current.runWorkspace('w1')).toBeNull();
      expect(result.current.runWorkspace('w9')).toBeNull();
      expect(startRunCall).not.toHaveBeenCalled();
    });
  });

  describe('stopWorkspace', () => {
    it('stops the run of a workspace that is not the one open', () => {
      const { stopRunCall } = bridge();

      useAppStore.setState({ selectedWorkspaceId: null });
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

      const { result } = renderHook(() => useRunActions());

      act(() => {
        result.current.stopWorkspace('w1');
      });

      expect(stopRunCall).toHaveBeenCalledWith('w1');
    });
  });

  /**
   * The keybinds hold these actions at the root of the app. They read the workspace when they
   * are used, so a run's clock never renders the whole app again.
   */
  it('does NOT render again when a workspace changes', () => {
    const renders = { count: 0 };

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
    renderHook(() => {
      renders.count += 1;

      return useRunActions();
    });

    act(() => {
      useWorkspaceStore.getState().tickClock();
      useWorkspaceStore
        .getState()
        .renameWorkspace({ workspaceId: 'w1', name: 'Renamed' });
    });

    expect(renders.count).toBe(1);
  });
});
