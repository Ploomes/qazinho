// @vitest-environment jsdom
import type { IProShare } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProMergeModalViewModel } from '@/modules/Pro/components/ProMergeModal/hooks';
import { syncedCaseOf } from '@/modules/Pro/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

const WORKSPACE = makeWorkspace();
const BASE = WORKSPACE.plan.map(syncedCaseOf);
const FIRST = BASE[0]!;
const HERE = {
  ...WORKSPACE,
  plan: WORKSPACE.plan.map((one, index) =>
    index === 0 ? { ...one, title: 'Here' } : one,
  ),
};

/** Bruno retitled the first case in the org, and this computer retitled it too. */
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
      cases: [{ ...FIRST, title: 'Theirs' }, ...BASE.slice(1)],
      editedBy,
      editedAt: '2026-10-24T11:30:00.000Z',
    },
  ],
});

let resolved: number[] = [];

beforeEach(() => {
  resolved = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    resolveProConflict: (props) => {
      resolved.push(props.version);

      return Promise.resolve({ ...shareBy('Bruno'), conflicts: [] });
    },
  };
  useProStore.setState({ shares: [shareBy('Bruno')], merging: 'p1' });
  useWorkspaceStore.setState({ workspaces: [HERE] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProMergeModalViewModel', () => {
  describe('plans', () => {
    it('lists each case both sides changed, this computer’s and the org’s side by side', () => {
      const { result } = renderHook(() => useProMergeModalViewModel());
      const [plan] = result.current.plans;

      expect(plan?.title).toContain('Bruno');
      expect(plan?.clashes.map(({ key }) => key)).toEqual([FIRST.id]);
      expect(plan?.clashes[0]?.sides.map(({ title }) => title)).toEqual([
        'Here',
        'Theirs',
      ]);
      expect(plan?.clashes[0]?.sides.map(({ isChosen }) => isChosen)).toEqual([
        true,
        false,
      ]);
    });

    it('marks on each side only what differs from the other: here, the title', () => {
      const { result } = renderHook(() => useProMergeModalViewModel());
      const sides = result.current.plans[0]?.clashes[0]?.sides ?? [];

      expect(sides.map(({ isTitleChanged }) => isTitleChanged)).toEqual([true, true]);
      expect(sides.map(({ isGoalChanged }) => isGoalChanged)).toEqual([false, false]);
      expect(
        sides.flatMap(({ steps }) =>
          steps.flatMap(({ isActionChanged, isExpectedChanged }) => [
            isActionChanged,
            isExpectedChanged,
          ]),
        ),
      ).not.toContain(true);
    });

    it("marks a step's expected result that differs, and a step one side does not have", () => {
      const step = { action: 'Pay', expected: 'Paid' };
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...HERE,
            plan: HERE.plan.map((one, index) =>
              index === 0 ? { ...one, steps: [{ ...one.steps[0]!, ...step }] } : one,
            ),
          },
        ],
      });
      useProStore.setState({
        shares: [
          {
            ...shareBy('Bruno'),
            conflicts: [
              {
                ...shareBy('Bruno').conflicts[0]!,
                cases: [
                  {
                    ...FIRST,
                    title: 'Theirs',
                    steps: [{ ...step, expected: 'Refused' }, step],
                  },
                  ...BASE.slice(1),
                ],
              },
            ],
          },
        ],
      });

      const { result } = renderHook(() => useProMergeModalViewModel());
      const [mine, theirs] = result.current.plans[0]?.clashes[0]?.sides ?? [];

      expect(mine?.steps.map(({ isExpectedChanged }) => isExpectedChanged)).toEqual([
        true,
      ]);
      expect(
        theirs?.steps.map(({ isActionChanged, isExpectedChanged }) => [
          isActionChanged,
          isExpectedChanged,
        ]),
      ).toEqual([
        [false, true],
        [true, true],
      ]);
    });

    it('names no one when the org does not say who changed it', () => {
      useProStore.setState({ shares: [shareBy(null)] });
      const { result } = renderHook(() => useProMergeModalViewModel());

      expect(result.current.plans[0]?.title).not.toContain('Bruno');
    });

    it('does NOT list a plan whose changes join on their own', () => {
      useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
      const { result } = renderHook(() => useProMergeModalViewModel());

      expect(result.current.plans).toEqual([]);
    });

    it('says a side deleted the case, rather than showing an empty one', () => {
      useProStore.setState({
        shares: [
          {
            ...shareBy('Bruno'),
            conflicts: [{ ...shareBy('Bruno').conflicts[0]!, cases: BASE.slice(1) }],
          },
        ],
      });
      const { result } = renderHook(() => useProMergeModalViewModel());

      expect(result.current.plans[0]?.clashes[0]?.sides[1]?.isDeleted).toBe(true);
    });
  });

  describe('onKeep', () => {
    it('marks the side the QA keeps', () => {
      const { result } = renderHook(() => useProMergeModalViewModel());

      act(() => {
        result.current.plans[0]?.clashes[0]?.sides[1]?.onKeep();
      });

      expect(
        result.current.plans[0]?.clashes[0]?.sides.map(({ isChosen }) => isChosen),
      ).toEqual([false, true]);
    });
  });

  describe('onConfirm', () => {
    it('takes the plans in with what the QA kept, and closes', async () => {
      const { result } = renderHook(() => useProMergeModalViewModel());

      act(() => {
        result.current.plans[0]?.clashes[0]?.sides[1]?.onKeep();
      });
      await act(async () => {
        result.current.onConfirm();
        await Promise.resolve();
      });

      expect(resolved).toEqual([4]);
      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.title).toBe('Theirs');
      expect(useProStore.getState().merging).toBeNull();
    });
  });

  describe('a run that waited on the merge', () => {
    it('starts once the plans are taken in', async () => {
      const startRun = vi.fn(() => Promise.resolve());
      window.qazinho = { ...window.qazinho, startRun };
      useAppStore.setState({
        projects: [
          {
            id: 'p1',
            name: 'Shop',
            targets: [
              { id: 't1', kind: 'web', label: 'Web', value: 'https://shop.test' },
            ],
            repositories: [],
          },
        ],
        selectedWorkspaceId: 'w1',
      });
      useProStore.setState({ heldRun: { workspaceId: 'w1', mode: 'agent' } });
      const { result } = renderHook(() => useProMergeModalViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(useProStore.getState().heldRun).toBeNull();
      expect(startRun).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'w1', mode: 'agent' }),
      );
    });
  });

  describe('a call that fails', () => {
    it('lets the QA take the plans in again, the window still open', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        resolveProConflict: () => Promise.reject(new Error('main went away')),
      };
      const { result } = renderHook(() => useProMergeModalViewModel());

      await act(async () => {
        result.current.onConfirm();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(result.current.canConfirm).toBe(true);
      expect(useProStore.getState().merging).toBe('p1');
    });
  });

  describe('onCancel', () => {
    it('closes without taking anything in', () => {
      const { result } = renderHook(() => useProMergeModalViewModel());

      act(() => {
        result.current.onCancel();
      });

      expect(resolved).toEqual([]);
      expect(useProStore.getState().merging).toBeNull();
    });
  });
});
