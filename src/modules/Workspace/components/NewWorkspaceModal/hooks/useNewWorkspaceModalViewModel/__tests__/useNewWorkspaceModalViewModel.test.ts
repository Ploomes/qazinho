// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNewWorkspaceModalViewModel } from '@/modules/Workspace/components/NewWorkspaceModal/hooks/useNewWorkspaceModalViewModel';
import { useAppStore, useSetupStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [
    { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' },
    { id: 't2', kind: 'android' as const, label: 'Android · Pixel 7', value: 'shop.apk' },
  ],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedProjectId: 'p1',
    modal: 'workspace',
    selectedWorkspaceId: null,
  });
  useWorkspaceStore.setState({ workspaces: [] });
  useSetupStore.setState({ integrations: [] });
});

describe('useNewWorkspaceModalViewModel', () => {
  it('offers the targets of the project it was opened under', () => {
    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    expect(result.current.targets).toHaveLength(2);
    expect(result.current.chosenTargetId).toBe('t1');
    expect(
      result.current.platforms.map(({ label, isChosen }) => [label, isChosen]),
    ).toEqual(
      result.current.targets.map((target, index) => [
        { web: 'Web', android: 'Android', ios: 'iOS' }[target.kind],
        index === 0,
      ]),
    );
  });

  it('asks for no platform when the project has only one', () => {
    useAppStore.setState({ projects: [{ ...PROJECT, targets: [PROJECT.targets[0]!] }] });

    const { result } = renderHook(() => useNewWorkspaceModalViewModel());

    expect(result.current.hasPlatforms).toBe(false);
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
      result.current.platforms[1]?.onClick();
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
      result.current.platforms[1]?.onClick();
    });
    act(() => {
      result.current.onCreate();
    });

    expect(useWorkspaceStore.getState().workspaces[0]?.planKind).toBe('mobile');
  });

  describe('importing tests', () => {
    const FOLDER = {
      name: 'loja-e2e',
      dir: '/Users/qa/loja-e2e',
      frameworks: [{ id: 'playwright', files: 3 }],
      files: ['a.spec.ts'],
      branch: 'main',
      commit: 'abc123',
    };

    it('opens the import in the chat of the workspace it makes', () => {
      useAppStore.setState({ pendingImport: null });

      const { result } = renderHook(() => useNewWorkspaceModalViewModel());

      act(() => {
        result.current.onFolderChange(FOLDER);
      });
      act(() => {
        result.current.onCreate();
      });

      expect(useAppStore.getState().pendingImport).toEqual({
        workspaceId: useAppStore.getState().selectedWorkspaceId,
        source: FOLDER,
      });
    });

    it('asks for nothing when no folder was picked', () => {
      useAppStore.setState({ pendingImport: null });

      const { result } = renderHook(() => useNewWorkspaceModalViewModel());

      act(() => {
        result.current.onNameChange('Checkout');
      });
      act(() => {
        result.current.onCreate();
      });

      expect(useAppStore.getState().pendingImport).toBeNull();
    });

    /** Quem escolhe a pasta já disse o que vai testar: pedir um nome seria mais um passo. */
    it('names the workspace after the folder, and never over what the QA typed', () => {
      const { result } = renderHook(() => useNewWorkspaceModalViewModel());

      act(() => {
        result.current.onFolderChange(FOLDER);
      });

      expect(result.current.name).toBe('loja-e2e');

      act(() => {
        result.current.onNameChange('Checkout');
      });
      act(() => {
        result.current.onFolderChange(null);
      });
      act(() => {
        result.current.onFolderChange(FOLDER);
      });

      expect(result.current.name).toBe('Checkout');
    });
  });
});
