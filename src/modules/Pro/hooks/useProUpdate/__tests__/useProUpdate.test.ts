// @vitest-environment jsdom
import type { IProShare } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProUpdate } from '@/modules/Pro/hooks';
import { syncedCaseOf } from '@/modules/Pro/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore, useWorkspaceStore } from '@/store';

const WORKSPACE = makeWorkspace();
const BASE = WORKSPACE.plan.map(syncedCaseOf);
const FIRST = BASE[0]!;

/** O plano da org na versão 4: o Caio renomeou o primeiro caso. */
const theirsOf = (title: string) => [{ ...FIRST, title }, ...BASE.slice(1)];

const shareWith = (cases = theirsOf('Retitled in the org')): IProShare => ({
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'conflict',
  syncedAt: null,
  pending: [],
  conflicts: [
    {
      workspaceId: 'w1',
      base: BASE,
      version: 4,
      cases,
      editedBy: 'Caio',
      editedAt: '2026-10-24T11:30:00.000Z',
    },
  ],
});

let resolved: { workspaceId: string; version: number }[] = [];

beforeEach(() => {
  resolved = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    resolveProConflict: (props) => {
      resolved.push({ workspaceId: props.workspaceId, version: props.version });

      return Promise.resolve({ ...shareWith(), state: 'synced', conflicts: [] });
    },
  };
  useProStore.setState({ shares: [shareWith()], merging: null });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
  vi.restoreAllMocks();
});

const titleHere = () => useWorkspaceStore.getState().workspaces[0]?.plan[0]?.title;

describe('useProUpdate', () => {
  describe('update', () => {
    it('takes in at once a plan the org moved where nothing here clashes', async () => {
      const { result } = renderHook(() => useProUpdate());

      await act(async () => {
        await result.current.update('p1');
      });

      expect(resolved).toEqual([{ workspaceId: 'w1', version: 4 }]);
      expect(titleHere()).toBe('Retitled in the org');
      expect(useProStore.getState().merging).toBeNull();
    });

    it('opens the merge for a case both sides changed, taking nothing yet', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            plan: WORKSPACE.plan.map((one, index) =>
              index === 0 ? { ...one, title: 'Retitled here' } : one,
            ),
          },
        ],
      });
      const { result } = renderHook(() => useProUpdate());

      await act(async () => {
        await result.current.update('p1');
      });

      expect(resolved).toEqual([]);
      expect(useProStore.getState().merging).toBe('p1');
      expect(titleHere()).toBe('Retitled here');
    });

    it('does NOT touch a plan a run holds now', async () => {
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: [] })],
      });
      const { result } = renderHook(() => useProUpdate());

      await act(async () => {
        await result.current.update('p1');
      });

      expect(resolved).toEqual([]);
      expect(useProStore.getState().merging).toBeNull();
    });
  });

  describe('takeChosen', () => {
    it('keeps the side the QA chose of each clash, and closes the merge', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            plan: WORKSPACE.plan.map((one, index) =>
              index === 0 ? { ...one, title: 'Retitled here' } : one,
            ),
          },
        ],
      });
      useProStore.setState({ merging: 'p1' });
      const { result } = renderHook(() => useProUpdate());

      await act(async () => {
        await result.current.takeChosen({
          projectId: 'p1',
          choices: { w1: { [FIRST.id]: 'theirs' } },
        });
      });

      expect(resolved).toEqual([{ workspaceId: 'w1', version: 4 }]);
      expect(titleHere()).toBe('Retitled in the org');
      expect(useProStore.getState().merging).toBeNull();
    });
  });
});
