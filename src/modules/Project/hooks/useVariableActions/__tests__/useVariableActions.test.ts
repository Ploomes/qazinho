// @vitest-environment jsdom
import type { IApplyVariables, VariablesOutcome } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVariableActions } from '@/modules/Project/hooks/useVariableActions';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useVariablesStore, useWorkspaceStore } from '@/store';

const SAVED = [{ name: 'ADMIN_EMAIL', description: 'The admin' }];

/** A bridge whose vault answers every save with the outcome handed to it, and keeps what it was asked. */
function vault(outcome: VariablesOutcome = { isSaved: true, variables: SAVED }) {
  const applied: IApplyVariables[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    applyVariables: (apply) => {
      applied.push(apply);

      return Promise.resolve(outcome);
    },
  };

  return applied;
}

beforeEach(() => {
  useVariablesStore.setState({ byProject: {}, request: null, settled: null });
  useWorkspaceStore.setState({
    workspaces: [
      {
        ...makeWorkspace(),
        plan: [
          {
            ...makeWorkspace().plan[0]!,
            steps: [{ action: 'Type ${LOGIN_EMAIL} in Email', expected: 'It shows' }],
          },
        ],
      },
      { ...makeWorkspace(), id: 'w2', projectId: 'p2' },
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useVariableActions', () => {
  describe('applyVariables', () => {
    it('keeps what the vault now holds for the project', async () => {
      const applied = vault();
      const { result } = renderHook(() => useVariableActions());
      const changes = [
        {
          kind: 'save' as const,
          name: 'ADMIN_EMAIL',
          description: 'The admin',
          value: 'qa@shop.test',
          from: null,
        },
      ];

      await act(async () => {
        await result.current.applyVariables({ projectId: 'p1', changes });
      });

      expect(applied).toEqual([{ projectId: 'p1', changes }]);
      expect(useVariablesStore.getState().byProject).toEqual({ p1: SAVED });
    });

    it("writes a renamed variable's new name in the plans of its project, and nowhere else", async () => {
      vault();

      const { result } = renderHook(() => useVariableActions());
      const before = useWorkspaceStore.getState().workspaces[1]?.plan;

      await act(async () => {
        await result.current.applyVariables({
          projectId: 'p1',
          changes: [
            {
              kind: 'save',
              name: 'ADMIN_EMAIL',
              description: 'The admin',
              value: null,
              from: 'LOGIN_EMAIL',
            },
          ],
        });
      });

      const [mine, other] = useWorkspaceStore.getState().workspaces;

      expect(mine?.plan[0]?.steps[0]?.action).toBe('Type ${ADMIN_EMAIL} in Email');
      expect(other?.plan).toBe(before);
    });

    it('does NOT keep anything when the vault refused', async () => {
      vault({ isSaved: false, failure: { reason: 'no-keychain' } });

      const { result } = renderHook(() => useVariableActions());
      let outcome: VariablesOutcome | null = null;

      await act(async () => {
        outcome = await result.current.applyVariables({ projectId: 'p1', changes: [] });
      });

      expect(outcome).toEqual({ isSaved: false, failure: { reason: 'no-keychain' } });
      expect(useVariablesStore.getState().byProject).toEqual({});
    });
  });

  describe('askVariables', () => {
    it('opens the window with the drafts, and answers with the names the QA kept', async () => {
      const { result } = renderHook(() => useVariableActions());
      let saved: string[] | null | undefined;

      void result.current
        .askVariables({ projectId: 'p1', drafts: SAVED })
        .then((names) => {
          saved = names;
        });

      const request = useVariablesStore.getState().request;

      expect(request).toMatchObject({ projectId: 'p1', drafts: SAVED });

      act(() => {
        useVariablesStore
          .getState()
          .settle({ id: request?.id ?? '', saved: ['ADMIN_EMAIL'] });
      });

      await waitFor(() => {
        expect(saved).toEqual(['ADMIN_EMAIL']);
      });
      expect(useVariablesStore.getState().request).toBeNull();
    });

    it('answers nothing when another ask takes the window over', async () => {
      const { result } = renderHook(() => useVariableActions());
      let first: string[] | null | undefined;

      void result.current
        .askVariables({ projectId: 'p1', drafts: SAVED })
        .then((names) => {
          first = names;
        });
      void result.current.askVariables({ projectId: 'p2', drafts: SAVED });

      await waitFor(() => {
        expect(first).toBeNull();
      });
      expect(useVariablesStore.getState().request?.projectId).toBe('p2');
    });

    it('closes the window and answers nothing once the wait runs out', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useVariableActions());
      let saved: string[] | null | undefined;

      void result.current
        .askVariables({ projectId: 'p1', drafts: SAVED, waitMs: 1_000 })
        .then((names) => {
          saved = names;
        });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });

      expect(saved).toBeNull();
      expect(useVariablesStore.getState().request).toBeNull();
    });
  });
});
