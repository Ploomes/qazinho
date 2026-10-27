// @vitest-environment jsdom
import type { IProShare } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProRunWarningViewModel } from '@/modules/Pro/components/ProRunWarning/hooks';
import { syncedCaseOf } from '@/modules/Pro/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

const WORKSPACE = makeWorkspace();
const BASE = WORKSPACE.plan.map(syncedCaseOf);
const PROJECT = {
  id: 'p1',
  name: 'Shop',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

const shareBy = (editedBy: string | null): IProShare => ({
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
      cases: [{ ...BASE[0]!, title: 'Theirs' }, ...BASE.slice(1)],
      editedBy,
      editedAt: '2026-10-24T11:30:00.000Z',
    },
  ],
});

const startRun = vi.fn(() => Promise.resolve());
let resolved: number[] = [];

beforeEach(() => {
  resolved = [];
  startRun.mockClear();
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    startRun,
    resolveProConflict: (props) => {
      resolved.push(props.version);

      return Promise.resolve({ ...shareBy('Bruno'), conflicts: [] });
    },
  };
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
  useProStore.setState({
    shares: [shareBy('Bruno')],
    heldRun: { workspaceId: 'w1', mode: 'agent' },
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProRunWarningViewModel', () => {
  describe('text', () => {
    it('names who changed the plan in the org', () => {
      const { result } = renderHook(() => useProRunWarningViewModel());

      expect(result.current.text).toContain('Bruno');
      expect(result.current.text).toContain('Checkout regression');
    });

    it('names no one when the org does not say who', () => {
      useProStore.setState({ shares: [shareBy(null)] });
      const { result } = renderHook(() => useProRunWarningViewModel());

      expect(result.current.text).not.toContain('Bruno');
    });
  });

  describe('onConfirm', () => {
    it('updates the plan from the org, then runs it the way it was asked', async () => {
      const { result } = renderHook(() => useProRunWarningViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(resolved).toEqual([4]);
      expect(useProStore.getState().heldRun).toBeNull();
      expect(startRun).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'w1', mode: 'agent' }),
      );
    });

    it('waits on the merge when a case of the plan changed on both sides, running nothing yet', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...WORKSPACE,
            plan: WORKSPACE.plan.map((one, index) =>
              index === 0 ? { ...one, title: 'Here' } : one,
            ),
          },
        ],
      });
      const { result } = renderHook(() => useProRunWarningViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(useProStore.getState().merging).toBe('p1');
      expect(useProStore.getState().heldRun).toEqual({
        workspaceId: 'w1',
        mode: 'agent',
      });
      expect(startRun).not.toHaveBeenCalled();
    });
  });

  describe('a call that fails', () => {
    it('closes the warning instead of holding it busy, and runs nothing', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        startRun,
        resolveProConflict: () => Promise.reject(new Error('main went away')),
      };
      const { result } = renderHook(() => useProRunWarningViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(useProStore.getState().heldRun).toBeNull();
      expect(startRun).not.toHaveBeenCalled();
    });
  });

  describe('while the update is out', () => {
    it('says so, and does NOT run the plan as it stands here meanwhile', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        startRun,
        resolveProConflict: () => new Promise(() => undefined),
      };
      const { result } = renderHook(() => useProRunWarningViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(result.current).toMatchObject({
        confirmLabel: 'Updating…',
        canConfirm: false,
        canRunAnyway: false,
      });

      act(() => {
        result.current.onRunAnyway();
      });

      expect(startRun).not.toHaveBeenCalled();
      expect(useProStore.getState().heldRun).not.toBeNull();
    });
  });

  describe('onRunAnyway', () => {
    it('runs the plan as it stands here, the way it was asked', () => {
      const { result } = renderHook(() => useProRunWarningViewModel());

      act(() => {
        result.current.onRunAnyway();
      });

      expect(useProStore.getState().heldRun).toBeNull();
      expect(startRun).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'w1', mode: 'agent' }),
      );
      expect(resolved).toEqual([]);
    });
  });

  describe('onCancel', () => {
    it('neither runs nor updates', () => {
      const { result } = renderHook(() => useProRunWarningViewModel());

      act(() => {
        result.current.onCancel();
      });

      expect(useProStore.getState().heldRun).toBeNull();
      expect(startRun).not.toHaveBeenCalled();
      expect(resolved).toEqual([]);
    });
  });
});
