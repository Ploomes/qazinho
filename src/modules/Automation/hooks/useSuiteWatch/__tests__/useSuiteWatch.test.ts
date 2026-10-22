// @vitest-environment jsdom
import type { ISuite, ISuiteChange, SuiteChangeEvent, SuiteEvent } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSuiteWatch } from '@/modules/Automation/hooks/useSuiteWatch';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSuiteStore } from '@/store';

const PROJECT = (id: string) => ({ id, name: id, targets: [], repositories: [] });

const SUITE: ISuite = {
  projectId: 'p1',
  path: '/qa/e2e',
  name: 'e2e',
  config: 'playwright.config.ts',
  version: '1.64.1',
  branch: 'main',
  repository: 'acme/e2e',
  envKeys: ['BASE_URL'],
  envFileKeys: ['BASE_URL'],
};

const CHANGE = {
  id: 'c-01',
  projectId: 'p1',
  startedAt: 5,
  status: 'ready',
} as ISuiteChange;

let forgotten: string[] = [];
let listener: ((event: SuiteEvent) => void) | null = null;
let changeListener: ((event: SuiteChangeEvent) => void) | null = null;

beforeEach(() => {
  forgotten = [];
  listener = null;
  changeListener = null;
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    suiteOf: (projectId) => Promise.resolve(projectId === 'p1' ? SUITE : null),
    suiteRuns: (projectId) =>
      Promise.resolve(
        projectId === 'p1'
          ? [
              {
                id: 's-01',
                projectId: 'p1',
                startedAt: 1,
                endedAt: 2,
                status: 'passed' as const,
                total: 3,
                results: [],
                failure: null,
                said: '',
              },
            ]
          : [],
      ),
    forgetSuite: (projectId) => {
      forgotten.push(projectId);

      return Promise.resolve();
    },
    onSuiteEvent: (heard) => {
      listener = heard;

      return () => {
        listener = null;
      };
    },
    suiteChanges: (projectId) => Promise.resolve(projectId === 'p1' ? [CHANGE] : []),
    onSuiteChangeEvent: (heard) => {
      changeListener = heard;

      return () => {
        changeListener = null;
      };
    },
  };
  useSuiteStore.setState({
    suites: {},
    lists: {},
    runs: {},
    live: {},
    picked: {},
    changes: {},
    changeNotes: {},
  });
  useAppStore.setState({ projects: [PROJECT('p1'), PROJECT('p2')], isLoaded: true });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSuiteWatch', () => {
  it('reads the suite each project is connected to when QAzinho opens', async () => {
    renderHook(() => {
      useSuiteWatch();
    });

    await waitFor(() => {
      expect(useSuiteStore.getState().suites).toEqual({ p1: SUITE });
    });
  });

  it('reads the runs of each suite, so the sidebar tells how the last one went', async () => {
    renderHook(() => {
      useSuiteWatch();
    });

    await waitFor(() => {
      expect(useSuiteStore.getState().runs.p1?.map(({ id }) => id)).toEqual(['s-01']);
    });
    expect(useSuiteStore.getState().runs.p2).toBeUndefined();
  });

  it('reads the changes the agent made to each suite', async () => {
    renderHook(() => {
      useSuiteWatch();
    });

    await waitFor(() => {
      expect(useSuiteStore.getState().changes.p1).toEqual([CHANGE]);
    });
  });

  it('hears a change as the agent makes it, and what it says meanwhile', async () => {
    renderHook(() => {
      useSuiteWatch();
    });
    await waitFor(() => {
      expect(useSuiteStore.getState().changes.p1).toBeDefined();
    });

    act(() => {
      changeListener?.({ kind: 'changed', change: { ...CHANGE, status: 'shipped' } });
      changeListener?.({
        kind: 'line',
        projectId: 'p1',
        changeId: 'c-01',
        text: 'Read ./tests',
      });
    });

    expect(useSuiteStore.getState().changes.p1?.[0]?.status).toBe('shipped');
    expect(useSuiteStore.getState().changeNotes['c-01']).toEqual([
      { id: 1, kind: 'said', text: 'Read ./tests' },
    ]);
  });

  it('hears a run of a suite as it goes', async () => {
    renderHook(() => {
      useSuiteWatch();
    });
    await waitFor(() => {
      expect(useSuiteStore.getState().runs.p1).toBeDefined();
    });

    act(() => {
      listener?.({
        kind: 'started',
        run: {
          id: 's-01',
          projectId: 'p1',
          startedAt: 1,
          endedAt: null,
          status: 'running',
          total: 0,
          results: [],
          failure: null,
          said: '',
        },
      });
    });

    expect(useSuiteStore.getState().runs.p1?.[0]?.status).toBe('running');
    expect(useSuiteStore.getState().live.p1).toEqual({ runId: 's-01', going: {} });
  });

  it('forgets the suite of a project the QA deleted, and only that one', async () => {
    renderHook(() => {
      useSuiteWatch();
    });
    await waitFor(() => {
      expect(useSuiteStore.getState().suites.p1).toBeDefined();
    });

    act(() => {
      useAppStore.setState({ projects: [PROJECT('p2')] });
    });

    expect(forgotten).toEqual(['p1']);
    expect(useSuiteStore.getState().suites).toEqual({});
  });

  it('does NOT read any suite before the projects are loaded', () => {
    let asked = 0;

    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      suiteOf: () => {
        asked += 1;

        return Promise.resolve(null);
      },
    };
    useAppStore.setState({ isLoaded: false });
    renderHook(() => {
      useSuiteWatch();
    });

    expect(asked).toBe(0);
  });
});
