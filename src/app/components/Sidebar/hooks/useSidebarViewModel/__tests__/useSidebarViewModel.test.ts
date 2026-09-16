// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSidebarViewModel } from '@/app/components/Sidebar/hooks/useSidebarViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [] };

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedWorkspaceId: null,
    modal: null,
    screen: 'workspace',
  });
  useWorkspaceStore.setState({ workspaces: [], removingWorkspaceId: null });
});

describe('useSidebarViewModel', () => {
  describe('rows', () => {
    it('opens a project with its header and closes it with the add row', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows.map(({ kind }) => kind)).toEqual(['header', 'add']);
    });

    it('nests every workspace under the project it belongs to', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows[1]).toMatchObject({
        kind: 'workspace',
        name: 'Checkout regression',
        meta: '6 steps',
      });
    });

    it('does NOT list a workspace of another project', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p2' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows.map(({ kind }) => kind)).toEqual(['header', 'add']);
    });
  });

  describe('waitingName', () => {
    it('names the workspace that stopped to ask something', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), status: 'attention', name: 'Onboarding' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBe('Onboarding');
    });

    it('names nobody while no agent is waiting', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBeNull();
    });
  });

  describe('onNewWorkspace', () => {
    it('opens the modal on the project the QA clicked under', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => result.current.onNewWorkspace('p1'));

      expect(useAppStore.getState().modal).toBe('workspace');
      expect(useAppStore.getState().selectedProjectId).toBe('p1');
    });
  });

  describe('onRemoveWorkspace', () => {
    it('asks before it removes, because a workspace holds every run it did', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onAskRemove('w1');
      });

      expect(result.current.rows[1]).toMatchObject({ isRemoving: true });
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
    });

    it('drops the workspace once the QA says so', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w1');
      });

      expect(useWorkspaceStore.getState().workspaces).toEqual([]);
      expect(useWorkspaceStore.getState().removingWorkspaceId).toBeNull();
    });

    it('leaves the workspace screen when the one on it is gone', () => {
      useAppStore.setState({ selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w1');
      });

      expect(useAppStore.getState().screen).toBe('welcome');
      expect(useAppStore.getState().selectedWorkspaceId).toBeNull();
    });

    it('stays where it is when another workspace is removed', () => {
      useAppStore.setState({ selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w2');
      });

      expect(useAppStore.getState().screen).toBe('workspace');
      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
    });
  });
});
