// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNewWorkspaceModalViewModel } from '@/modules/Workspace/components/NewWorkspaceModal/hooks/useNewWorkspaceModalViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [
    { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' },
    { id: 't2', kind: 'android' as const, label: 'Android · Pixel 7', value: 'shop.apk' },
  ],
};

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedProjectId: 'p1',
    modal: 'workspace',
    selectedWorkspaceId: null,
  });
  useWorkspaceStore.setState({ workspaces: [] });
});

describe('useNewWorkspaceModalViewModel', () => {
  it('offers the targets of the project it was opened under', () => {
    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    expect(result.current.projectName).toBe('Shop · staging');
    expect(result.current.targets).toHaveLength(2);
    expect(result.current.chosenTargetId).toBe('t1');
  });

  it('cannot create a workspace with no name', () => {
    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    expect(result.current.canCreate).toBe(false);
  });

  it('creates the workspace on the chosen target and opens it', () => {
    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    act(() => {
      result.current.onNameChange('Checkout regression');
      result.current.onTargetChange('t2');
    });
    act(() => {
      result.current.onCreate();
    });

    const [workspace] = useWorkspaceStore.getState().workspaces;

    expect(workspace?.name).toBe('Checkout regression');
    expect(workspace?.targetId).toBe('t2');
    expect(useAppStore.getState().selectedWorkspaceId).toBe(workspace?.id);
    expect(useAppStore.getState().modal).toBeNull();
  });

  it('drafts mobile cases when the target is a build', () => {
    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    act(() => {
      result.current.onNameChange('Sign up');
      result.current.onTargetChange('t2');
    });
    act(() => {
      result.current.onCreate();
    });

    expect(useWorkspaceStore.getState().workspaces[0]?.planKind).toBe('mobile');
  });
});
