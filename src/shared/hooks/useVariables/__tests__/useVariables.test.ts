// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useVariables } from '@/shared/hooks/useVariables';
import { useAppStore, useVariablesStore } from '@/store';

const PROJECT = (id: string) => ({ id, name: id, targets: [], repositories: [] });

let forgotten: string[] = [];

beforeEach(() => {
  forgotten = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listVariables: () =>
      Promise.resolve([
        {
          projectId: 'p1',
          variables: [{ name: 'LOGIN_EMAIL', description: 'The admin' }],
        },
      ]),
    forgetVariables: (projectId) => {
      forgotten.push(projectId);

      return Promise.resolve();
    },
  };
  useVariablesStore.setState({ byProject: {}, request: null, settled: null });
  useAppStore.setState({ projects: [PROJECT('p1'), PROJECT('p2')], isLoaded: true });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useVariables', () => {
  it("reads every project's variables when QAzinho opens", async () => {
    renderHook(() => {
      useVariables();
    });

    await waitFor(() => {
      expect(useVariablesStore.getState().byProject).toEqual({
        p1: [{ name: 'LOGIN_EMAIL', description: 'The admin' }],
      });
    });
  });

  it('forgets the variables of a project the QA deleted, and only that one', async () => {
    renderHook(() => {
      useVariables();
    });
    await waitFor(() => {
      expect(useVariablesStore.getState().byProject.p1).toBeDefined();
    });

    act(() => {
      useAppStore.setState({ projects: [PROJECT('p2')] });
    });

    expect(forgotten).toEqual(['p1']);
    expect(useVariablesStore.getState().byProject.p1).toBeUndefined();
  });

  it('does NOT forget anything while the projects are still loading', () => {
    useAppStore.setState({ isLoaded: false });
    renderHook(() => {
      useVariables();
    });

    act(() => {
      useAppStore.setState({ projects: [] });
    });

    expect(forgotten).toEqual([]);
  });
});
