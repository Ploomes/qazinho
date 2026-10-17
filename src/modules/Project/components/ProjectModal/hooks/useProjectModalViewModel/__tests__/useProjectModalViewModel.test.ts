// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProjectModalViewModel } from '@/modules/Project/components/ProjectModal/hooks/useProjectModalViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useAppStore.setState({
    projects: [],
    modal: 'project',
    editingProjectId: null,
    selectedWorkspaceId: null,
    screen: 'welcome',
  });
  useWorkspaceStore.setState({ workspaces: [] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProjectModalViewModel', () => {
  it('cannot create a project with no name and no target', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.canConfirm).toBe(false);
  });

  it('cannot create a project that has a name but nothing to test', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
    });

    expect(result.current.canConfirm).toBe(false);
  });

  it('creates the project with the targets that were filled in', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
      result.current.onUrlChange('https://staging.shop.test');
    });
    act(() => {
      result.current.onConfirm();
    });

    const [project] = useAppStore.getState().projects;

    expect(project?.name).toBe('Shop · staging');
    expect(project?.targets).toHaveLength(1);
    expect(project?.targets[0]?.kind).toBe('web');
    expect(useAppStore.getState().modal).toBeNull();
  });

  it('turns iOS off when Xcode is not there, even on a Mac', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.isMac).toBe(true);
    expect(result.current.isIosAvailable).toBe(false);
    expect(result.current.xcodeNote).toBe('Xcode not found');
  });

  it('says iOS is macOS only anywhere else', () => {
    window.qazinho = fakeQazinhoApi('win32');

    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.xcodeNote).toBe('macOS only');
  });

  describe('footerHint', () => {
    it('says what is missing first, which is the name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.footerHint).toBe('Name the project to create it');
    });

    it('asks for a target once the project has a name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
      });

      expect(result.current.footerHint).toBe('Add one target: a URL, an .apk or a .app');
    });

    it('says nothing once the button can be pressed', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('https://staging.shop.test');
      });

      expect(result.current.footerHint).toBeUndefined();
      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('editing a project', () => {
    const SAVED = {
      id: 'p1',
      name: 'Shop · staging',
      targets: [
        { id: 't-web', kind: 'web' as const, label: 'Web', value: 'https://a.test' },
      ],
    };

    beforeEach(() => {
      useAppStore.setState({ projects: [SAVED], editingProjectId: 'p1' });
    });

    it('opens with what the project already has', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.isEditing).toBe(true);
      expect(result.current.name).toBe('Shop · staging');
      expect(result.current.url).toBe('https://a.test');
      expect(result.current.confirmLabel).toBe('Save changes');
    });

    it('stays on the project while it animates out, after the store has let go', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onCancel();
      });

      expect(useAppStore.getState().editingProjectId).toBeNull();
      expect(result.current.title).toBe('Project settings');
      expect(result.current.confirmLabel).toBe('Save changes');
    });

    it('saves in place and keeps the target id a workspace points at', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · production');
        result.current.onUrlChange('  https://b.test  ');
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(useAppStore.getState().projects).toEqual([
        {
          ...SAVED,
          name: 'Shop · production',
          targets: [{ ...SAVED.targets[0], value: 'https://b.test' }],
        },
      ]);
    });

    it('does NOT let a target a workspace runs against go empty', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p1', targetId: 't-web' }],
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onUrlChange('');
      });

      expect(result.current.canConfirm).toBe(false);
    });

    it('asks before deleting, then takes the workspaces with it', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p2' },
        ],
      });
      useAppStore.setState({ selectedWorkspaceId: 'w1', screen: 'workspace' });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.deleteQuestion).toBe('Delete it and its workspace?');

      act(() => {
        result.current.onAskDelete();
      });

      expect(result.current.isConfirmingDelete).toBe(true);
      expect(useAppStore.getState().projects).toHaveLength(1);

      act(() => {
        result.current.onDelete();
      });

      expect(useAppStore.getState().projects).toEqual([]);
      expect(useAppStore.getState().screen).toBe('welcome');
      expect(useWorkspaceStore.getState().workspaces.map(({ id }) => id)).toEqual(['w2']);
    });
  });
});
