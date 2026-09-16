// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSidebarViewModel } from '@/app/components/Sidebar/hooks/useSidebarViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [] };

beforeEach(() => {
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: null, modal: null });
  useWorkspaceStore.setState({ workspaces: [] });
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
});
