// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlanActionsViewModel } from '@/modules/Workspace/components/PlanActions/hooks/usePlanActionsViewModel';
import { startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1', projects: [PROJECT] });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    panelTab: 'plan',
    chatDevices: {},
  });
});

describe('usePlanActionsViewModel', () => {
  it('offers to develop again once a case has a recording', () => {
    const { result } = renderHook(() => usePlanActionsViewModel());
    const workspace = useWorkspaceStore.getState().workspaces[0];

    expect(result.current.canRunWithAgent).toBe(false);

    act(() => {
      useWorkspaceStore.getState().setDevelopedCases({
        workspaceId: workspace?.id ?? '',
        caseIds: [workspace?.plan[0]?.id ?? ''],
      });
    });

    expect(result.current).toMatchObject({
      canRunWithAgent: true,
      developedCount: 1,
      toDevelopCount: (workspace?.plan.length ?? 0) - 1,
    });
  });

  it('does NOT offer a run to a workspace whose plan is empty', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => usePlanActionsViewModel());

    expect(result.current.canRun).toBe(false);
  });

  describe('onRun', () => {
    it('starts the run of the workspace on screen', () => {
      const { result } = renderHook(() => usePlanActionsViewModel());

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

      const { result } = renderHook(() => usePlanActionsViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    /**
     * As runs de iOS eram recusadas aqui enquanto o idb nunca tinha tocado um simulador
     * real; agora tocou.
     */
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

      const { result } = renderHook(() => usePlanActionsViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('says so instead of pretending when the target left the project', () => {
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [], repositories: [] }] });

      const { result } = renderHook(() => usePlanActionsViewModel());

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

      expect(renderHook(() => usePlanActionsViewModel()).result.current.pauseLabel).toBe(
        'Pause',
      );

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, isRunning: false } }],
      });

      expect(renderHook(() => usePlanActionsViewModel()).result.current.pauseLabel).toBe(
        'Resume',
      );
    });
  });

  it('offers an exploration even with no plan, and never while something walks', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => usePlanActionsViewModel());

    expect(result.current.canExplore).toBe(true);
    expect(result.current.exploreTip).toContain('10 minutes');

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [
          startRun({
            workspace: makeWorkspace([]),
            startedAt: '10:00',
            runId: 'r-01',
            by: WALKED_BY,
            kind: 'explore',
          }),
        ],
      });
    });

    expect(result.current.canExplore).toBe(false);
  });

  it('has nothing to offer when the selection points nowhere', () => {
    useAppStore.setState({ selectedWorkspaceId: 'gone' });

    const { result } = renderHook(() => usePlanActionsViewModel());

    expect(result.current.hasWorkspace).toBe(false);
    expect(result.current.canRun).toBe(false);
  });
});
