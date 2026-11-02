// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useImportFieldViewModel } from '@/modules/Project/components/ProjectModal/components/ImportField/hooks/useImportFieldViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({
    modal: 'project',
    pendingCommand: null,
    selectedWorkspaceId: null,
    screen: 'welcome',
  });
  useWorkspaceStore.setState({ workspaces: [] });
});

describe('useImportFieldViewModel', () => {
  it('cannot import before the project exists', () => {
    const { result } = renderHook(() => useImportFieldViewModel({ projectId: null }));

    expect(result.current.canImport).toBe(false);
    expect(result.current.note).toBe('Save the project first, then import from here.');
  });

  it('asks for a workspace when the project has none', () => {
    const { result } = renderHook(() => useImportFieldViewModel({ projectId: 'p1' }));

    expect(result.current.canImport).toBe(false);
    expect(result.current.note).toMatch(/Create a workspace/);
  });

  it('opens the chat of the open workspace with the import command asked for', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
        { ...makeWorkspace(), id: 'w2', projectId: 'p1' },
      ],
    });
    useAppStore.setState({ selectedWorkspaceId: 'w2' });

    const { result } = renderHook(() => useImportFieldViewModel({ projectId: 'p1' }));

    expect(result.current.canImport).toBe(true);
    expect(result.current.note).toBeNull();

    act(() => {
      result.current.onImport();
    });

    expect(useAppStore.getState()).toMatchObject({
      selectedWorkspaceId: 'w2',
      screen: 'workspace',
      modal: null,
      pendingCommand: 'import-plan',
    });
  });

  it('falls back to the first workspace of the project, never one of another', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { ...makeWorkspace(), id: 'other', projectId: 'p2' },
        { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
      ],
    });
    useAppStore.setState({ selectedWorkspaceId: 'other' });

    const { result } = renderHook(() => useImportFieldViewModel({ projectId: 'p1' }));

    act(() => {
      result.current.onImport();
    });

    expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
  });
});
