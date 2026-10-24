// @vitest-environment jsdom
import type { IProPlanConflict, IProShare } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProConflicts } from '@/modules/Pro/hooks';
import { syncedCaseOf } from '@/modules/Pro/library';
import {
  CASES,
  makeWorkspace,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore, useWorkspaceStore } from '@/store';

const BASE = CASES.map((testCase) => syncedCaseOf(testCase));

function conflictWith(cases: IProPlanConflict['cases']): IProPlanConflict {
  return {
    workspaceId: 'w1',
    base: BASE,
    version: 5,
    cases,
    editedBy: 'Bruno',
    editedAt: '2026-10-24T11:30:00.000Z',
  };
}

function shareWith(conflict: IProPlanConflict): IProShare {
  return {
    projectId: 'p1',
    orgSlug: 'loja',
    state: 'conflict',
    syncedAt: null,
    conflicts: [conflict],
  };
}

let resolved: { projectId: string; workspaceId: string; version: number }[] = [];

beforeEach(() => {
  resolved = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    resolveProConflict: (props) => {
      resolved.push(props);

      return Promise.resolve({
        projectId: props.projectId,
        orgSlug: 'loja',
        state: 'sending',
        syncedAt: null,
        conflicts: [],
      });
    },
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProConflicts', () => {
  it('takes the org’s change to a case this computer left alone, and builds on its version', async () => {
    const theirs = BASE.map((one, index) =>
      index === 1 ? { ...one, title: 'Checkout with Pix' } : one,
    );
    const workspace = {
      ...makeWorkspace(),
      plan: CASES.map((one) => ({ ...one, lastVerdict: 'passed' as const })),
    };

    useWorkspaceStore.setState({ workspaces: [workspace] });
    useProStore.setState({ shares: [shareWith(conflictWith(theirs))] });
    renderHook(() => {
      useProConflicts();
    });

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.plan[1]?.title).toBe(
        'Checkout with Pix',
      );
    });
    expect(resolved).toEqual([{ projectId: 'p1', workspaceId: 'w1', version: 5 }]);
    expect(useWorkspaceStore.getState().workspaces[0]?.plan[1]?.lastVerdict).toBe(
      'passed',
    );
    expect(useProStore.getState().shares[0]).toMatchObject({
      state: 'sending',
      conflicts: [],
    });
  });

  it('keeps this computer’s case when both changed it, with no question', async () => {
    const mine = CASES.map((one, index) =>
      index === 0 ? { ...one, title: 'Mine' } : one,
    );
    const theirs = BASE.map((one, index) =>
      index === 0
        ? { ...one, title: 'Theirs' }
        : index === 1
          ? { ...one, title: 'Org' }
          : one,
    );

    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), plan: mine }] });
    useProStore.setState({ shares: [shareWith(conflictWith(theirs))] });
    renderHook(() => {
      useProConflicts();
    });

    await waitFor(() => {
      expect(resolved).toHaveLength(1);
    });
    expect(
      useWorkspaceStore.getState().workspaces[0]?.plan.map(({ title }) => title),
    ).toEqual(['Mine', 'Org']);
  });

  it('waits for a run walking the plan to end before it changes the plan', async () => {
    const theirs = BASE.map((one, index) =>
      index === 1 ? { ...one, title: 'Later' } : one,
    );
    const walking = walkRun({ verdicts: ['passed'] });

    useWorkspaceStore.setState({ workspaces: [walking] });
    useProStore.setState({ shares: [shareWith(conflictWith(theirs))] });
    renderHook(() => {
      useProConflicts();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(resolved).toEqual([]);

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walking,
            live: walking.live === null ? null : { ...walking.live, isDone: true },
          },
        ],
      });
    });

    await waitFor(() => {
      expect(resolved).toHaveLength(1);
    });
  });

  it('resolves each version of a conflict once', async () => {
    const theirs = BASE.map((one, index) =>
      index === 1 ? { ...one, title: 'Once' } : one,
    );

    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
    useProStore.setState({ shares: [shareWith(conflictWith(theirs))] });
    const { rerender } = renderHook(() => {
      useProConflicts();
    });

    rerender();
    rerender();

    await waitFor(() => {
      expect(resolved).toHaveLength(1);
    });
  });
});
