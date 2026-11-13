// @vitest-environment jsdom
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IMemory } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMemoriesPaneViewModel } from '@/modules/Memory/components/MemoriesPane/hooks/useMemoriesPaneViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const memory = (over: Partial<IMemory> = {}): IMemory => ({
  id: 'm-1',
  text: 'Em Ajustes.',
  scope: 'project',
  workspaceId: null,
  target: 'all',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
  ...over,
});
const seed = (memories: IMemory[] | undefined) => {
  useAppStore.setState({
    projects: [{ id: 'p-1', name: 'Loja', targets: [], repositories: [], memories }],
  });
};
const view = () =>
  renderHook(() => useMemoriesPaneViewModel({ projectId: 'p-1' })).result;

describe('useMemoriesPaneViewModel', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [{ id: 'w-1', name: 'Cupons' } as IWorkspace],
    });
  });

  describe('rows', () => {
    it('has none for a project that learned nothing', () => {
      seed(undefined);

      expect(view().current.hasRows).toBe(false);
      expect(view().current.lead).toBe('Nothing learned yet.');
    });

    it('says nothing about where a memory of the whole project holds', () => {
      seed([memory()]);

      expect(view().current.rows[0]).toMatchObject({ text: 'Em Ajustes.', where: '' });
    });

    it('names the plan and the target when the memory only holds there', () => {
      seed([memory({ scope: 'plan', workspaceId: 'w-1', target: 'android' })]);

      expect(view().current.rows[0]?.where).toBe('Cupons, Android');
    });
  });

  describe('onForget', () => {
    it('takes the memory off the list and leaves the date for the org', () => {
      seed([memory()]);

      const result = view();

      act(() => {
        result.current.rows[0]?.onForget();
      });

      expect(result.current.rows).toEqual([]);
      expect(useAppStore.getState().projects[0]?.memories?.[0]).toMatchObject({
        text: '',
        deletedAt: expect.any(String),
      });
    });
  });
});
