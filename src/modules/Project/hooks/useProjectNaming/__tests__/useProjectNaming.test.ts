// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { AppNameSource } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectNaming } from '@/modules/Project/hooks';
import { blankWorkspaceOf } from '@/modules/Workspace/library';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PENDING: IProject = {
  id: 'p-1',
  name: 'Novo projeto',
  targets: [
    { id: 't-web', kind: 'web', label: 'Web', value: 'https://loja.test' },
    { id: 't-android', kind: 'android', label: 'Android', value: '/b/loja.apk' },
  ],
  repositories: [],
  isNamePending: true,
};
const { isNamePending: _pending, ...NAMED } = PENDING;
const WORKSPACE = blankWorkspaceOf({ projectId: 'p-1', name: 'Frete', now: 1 });

const bridge = (names: Partial<Record<AppNameSource['kind'], string>>) => {
  const appName = vi.fn((source: AppNameSource) =>
    Promise.resolve(names[source.kind] ?? null),
  );

  window.qazinho = { ...fakeQazinhoApi('darwin'), appName };

  return appName;
};

beforeEach(() => {
  useAppStore.setState({ projects: [PENDING], selectedWorkspaceId: WORKSPACE.id });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
});

afterEach(() => {
  cleanup();
});

describe('useProjectNaming', () => {
  it('names a new project by its site, and says so in its chat', async () => {
    bridge({ web: 'Loja Online', android: 'Loja' });
    renderHook(() => useProjectNaming());

    await waitFor(() => {
      expect(useAppStore.getState().projects[0]?.name).toBe('Loja Online');
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
      kind: 'named',
      name: 'Loja Online',
      from: 'site',
    });
  });

  it('goes on to the build when the site says no name', async () => {
    const appName = bridge({ android: 'Loja' });

    renderHook(() => useProjectNaming());

    await waitFor(() => {
      expect(useAppStore.getState().projects[0]).toEqual({ ...NAMED, name: 'Loja' });
    });
    expect(appName).toHaveBeenCalledTimes(2);
  });

  it('keeps the project waiting for the chat agent when nothing has a name', async () => {
    const appName = bridge({});

    renderHook(() => useProjectNaming());

    await waitFor(() => {
      expect(appName).toHaveBeenCalledTimes(2);
    });
    expect(useAppStore.getState().projects[0]).toMatchObject({
      name: 'Novo projeto',
      isNamePending: true,
    });
  });

  it('asks once per project, however many times the projects change', async () => {
    const appName = bridge({});
    const { rerender } = renderHook(() => useProjectNaming());

    await waitFor(() => {
      expect(appName).toHaveBeenCalledTimes(2);
    });
    act(() => {
      useAppStore.setState({ projects: [{ ...PENDING, memories: [] }] });
    });
    rerender();

    expect(appName).toHaveBeenCalledTimes(2);
  });

  it('reads again once the project gets an app it did not have', async () => {
    const appName = bridge({ ios: 'Loja iOS' });

    useAppStore.setState({ projects: [{ ...PENDING, targets: [] }] });
    renderHook(() => useProjectNaming());

    expect(appName).not.toHaveBeenCalled();

    act(() => {
      useAppStore.setState({
        projects: [
          {
            ...PENDING,
            targets: [{ id: 't-ios', kind: 'ios', label: 'iOS', value: '/b/Loja.app' }],
          },
        ],
      });
    });

    await waitFor(() => {
      expect(useAppStore.getState().projects[0]?.name).toBe('Loja iOS');
    });
  });

  it('does NOT ask for a project that has its name', () => {
    const appName = bridge({ web: 'Loja Online' });

    useAppStore.setState({ projects: [NAMED] });
    renderHook(() => useProjectNaming());

    expect(appName).not.toHaveBeenCalled();
  });
});
