// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useWorkspaceViewModel } from '@/modules/Workspace/screens/Workspace/hooks/useWorkspaceViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
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

  it('has no workspace to show when the selection points nowhere', () => {
    useAppStore.setState({ selectedWorkspaceId: 'gone' });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.workspace).toBeNull();
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
        startRun({ workspace: makeWorkspace(), startedAt: '09:41', runId: 'r-01' }),
      ],
    });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.isLive).toBe(true);
    expect(result.current.statusLabel).toBe('running · step 0 of 6');
  });

  describe('onRun', () => {
    it('starts the run of the workspace on screen', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('runs an android target too, because gocrash drives a phone now', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [
              { id: 't1', kind: 'android', label: 'Android', value: '/tmp/app.apk' },
            ],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('says so instead of pretending when the target is an iOS build', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [{ id: 't1', kind: 'ios', label: 'iOS', value: '/tmp/App.app' }],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      const [workspace] = useWorkspaceStore.getState().workspaces;

      expect(workspace?.status).toBe('stopped');
      expect(workspace?.chat.at(-1)).toMatchObject({ kind: 'error' });
    });
  });
});
