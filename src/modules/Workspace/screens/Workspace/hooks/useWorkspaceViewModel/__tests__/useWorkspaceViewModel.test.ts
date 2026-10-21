// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useWorkspaceViewModel } from '@/modules/Workspace/screens/Workspace/hooks/useWorkspaceViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1', projects: [PROJECT] });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], tab: 'chat' });
});

describe('useWorkspaceViewModel', () => {
  it('reads the workspace the sidebar selected', () => {
    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.name).toBe('Checkout regression');
    expect(result.current.planCount).toBe(2);
  });

  it('offers a run with the agent once a case passed, which a later run can walk again', () => {
    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.canRunWithAgent).toBe(false);

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({ verdicts: ['passed', 'passed', 'passed'], isFinished: true }),
        ],
      });
    });

    expect(result.current.canRunWithAgent).toBe(true);
  });

  it('has no workspace to show when the selection points nowhere', () => {
    useAppStore.setState({ selectedWorkspaceId: 'gone' });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.hasWorkspace).toBe(false);
    expect(result.current.canRun).toBe(false);
  });

  it('does NOT offer a run to a workspace whose plan is empty', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.canRun).toBe(false);
  });

  it('reads the live step in the header while the agent is driving', () => {
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

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.isLive).toBe(true);
    expect(result.current.statusLabel).toBe('running · step 1 of 6');
  });

  it('says the run is paused, with its step, while it waits for the QA', () => {
    const started = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    useWorkspaceStore.setState({
      workspaces: [{ ...started, live: { ...started.live!, isRunning: false } }],
    });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.liveStatus).toBe('paused');
    expect(result.current.statusLabel).toBe('paused · step 1 of 6');
  });

  /** The header read "step 0 of 1" while the first step ran. */
  it('names the step being walked, and never one past the last', () => {
    useWorkspaceStore.setState({
      workspaces: [
        walkRun({
          verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
        }),
      ],
    });

    expect(renderHook(() => useWorkspaceViewModel()).result.current.statusLabel).toBe(
      'running · step 6 of 6',
    );
  });

  describe('onRun', () => {
    it('starts the run of the workspace on screen', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('runs an android target too, because QAzinho drives a phone now', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [
              { id: 't1', kind: 'android', label: 'Android', value: '/tmp/app.apk' },
            ],
            repositories: [],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    /** iOS runs were refused here while idb had never tapped a real simulator; it has now. */
    it('runs an iOS build on the simulator, the way it runs the rest', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [{ id: 't1', kind: 'ios', label: 'iOS', value: '/tmp/App.app' }],
            repositories: [],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('says so instead of pretending when the target left the project', () => {
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [], repositories: [] }] });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      const [workspace] = useWorkspaceStore.getState().workspaces;

      expect(workspace?.status).toBe('stopped');
      expect(workspace?.chat.at(-1)).toMatchObject({
        kind: 'error',
        text: expect.stringContaining('gone from its project') as string,
      });
    });
  });

  describe('pauseLabel', () => {
    it('reads resume while the run is held, and pause while it goes', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({ workspaces: [walked] });

      expect(renderHook(() => useWorkspaceViewModel()).result.current.pauseLabel).toBe(
        'Pause',
      );

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, isRunning: false } }],
      });

      expect(renderHook(() => useWorkspaceViewModel()).result.current.pauseLabel).toBe(
        'Resume',
      );
    });
  });

  describe('onRename', () => {
    it('renames the open workspace, so the sidebar and the disk follow', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRename('Checkout');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.name).toBe('Checkout');
    });
  });
});
