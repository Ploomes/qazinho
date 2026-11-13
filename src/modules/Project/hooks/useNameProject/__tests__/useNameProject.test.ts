// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useNameProject } from '@/modules/Project/hooks';
import { blankWorkspaceOf } from '@/modules/Workspace/library';
import { useAppStore, useWorkspaceStore } from '@/store';

const PENDING: IProject = {
  id: 'p-1',
  name: 'Novo projeto',
  targets: [],
  repositories: [],
  isNamePending: true,
};
const FIRST = blankWorkspaceOf({ projectId: 'p-1', name: 'Frete', now: 1 });
const OPEN = blankWorkspaceOf({ projectId: 'p-1', name: 'Cupom', now: 2 });

const notesOf = (workspaceId: string) =>
  useWorkspaceStore
    .getState()
    .workspaces.find(({ id }) => id === workspaceId)
    ?.chat.filter(({ kind }) => kind === 'named');

beforeEach(() => {
  useAppStore.setState({ projects: [PENDING], selectedWorkspaceId: OPEN.id });
  useWorkspaceStore.setState({ workspaces: [FIRST, OPEN] });
});

afterEach(() => {
  cleanup();
});

describe('useNameProject', () => {
  it('names the project once and says so in the chat the QA has open', () => {
    const { result } = renderHook(() => useNameProject());

    act(() => {
      result.current({ projectId: 'p-1', name: ' Loja Online ', from: 'site' });
    });

    expect(useAppStore.getState().projects[0]).toEqual({
      id: 'p-1',
      name: 'Loja Online',
      targets: [],
      repositories: [],
    });
    expect(notesOf(OPEN.id)).toEqual([
      expect.objectContaining({ name: 'Loja Online', from: 'site', projectId: 'p-1' }),
    ]);
    expect(notesOf(FIRST.id)).toEqual([]);
  });

  it('says it in the chat whose agent named it', () => {
    const { result } = renderHook(() => useNameProject());

    act(() => {
      result.current({
        projectId: 'p-1',
        name: 'Loja',
        from: 'agent',
        workspaceId: FIRST.id,
      });
    });

    expect(notesOf(FIRST.id)).toHaveLength(1);
    expect(notesOf(OPEN.id)).toEqual([]);
  });

  it('does NOT rename a project that already has its name', () => {
    const { result } = renderHook(() => useNameProject());

    act(() => {
      result.current({ projectId: 'p-1', name: 'Loja Online', from: 'site' });
    });
    act(() => {
      result.current({ projectId: 'p-1', name: 'Outro nome', from: 'agent' });
    });

    expect(useAppStore.getState().projects[0]?.name).toBe('Loja Online');
    expect(notesOf(OPEN.id)).toHaveLength(1);
  });

  it('does NOT rename a project the QA already renamed by hand', () => {
    useAppStore.getState().putProject({ ...PENDING, name: 'Minha loja' });
    const { result } = renderHook(() => useNameProject());

    act(() => {
      result.current({ projectId: 'p-1', name: 'Loja Online', from: 'site' });
    });

    expect(useAppStore.getState().projects[0]?.name).toBe('Minha loja');
    expect(notesOf(OPEN.id)).toEqual([]);
  });

  it('does NOT take an empty name', () => {
    const { result } = renderHook(() => useNameProject());

    act(() => {
      result.current({ projectId: 'p-1', name: '  ', from: 'agent' });
    });

    expect(useAppStore.getState().projects[0]).toMatchObject({
      name: 'Novo projeto',
      isNamePending: true,
    });
  });
});
