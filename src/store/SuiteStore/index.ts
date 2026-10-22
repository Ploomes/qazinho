import type { ISuiteStore } from './types';
import { create } from 'zustand';
import { withoutKey } from '@/store/WorkspaceStore/library';
import { liveAfter, runsAfter } from './library';

export const useSuiteStore = create<ISuiteStore>((set) => ({
  suites: {},
  lists: {},
  runs: {},
  live: {},
  picked: {},

  putSuite: ({ projectId, suite }) =>
    set((state) => ({
      suites:
        suite === null
          ? withoutKey({ record: state.suites, key: projectId })
          : { ...state.suites, [projectId]: suite },
      ...(state.suites[projectId]?.path === suite?.path
        ? {}
        : {
            lists: withoutKey({ record: state.lists, key: projectId }),
            picked: withoutKey({ record: state.picked, key: projectId }),
          }),
    })),

  putList: ({ projectId, list }) =>
    set((state) => ({ lists: { ...state.lists, [projectId]: list } })),

  putRuns: ({ projectId, runs }) =>
    set((state) => ({ runs: { ...state.runs, [projectId]: runs } })),

  hear: (event) =>
    set((state) => {
      const projectId = 'run' in event ? event.run.projectId : event.projectId;
      const live = liveAfter({ live: state.live[projectId] ?? null, event });

      return {
        runs: {
          ...state.runs,
          [projectId]: runsAfter({ runs: state.runs[projectId] ?? [], event }),
        },
        live:
          live === null
            ? withoutKey({ record: state.live, key: projectId })
            : { ...state.live, [projectId]: live },
      };
    }),

  pickTest: ({ projectId, testId }) =>
    set((state) => ({ picked: { ...state.picked, [projectId]: testId } })),

  drop: (projectId) =>
    set((state) => ({
      suites: withoutKey({ record: state.suites, key: projectId }),
      lists: withoutKey({ record: state.lists, key: projectId }),
      runs: withoutKey({ record: state.runs, key: projectId }),
      live: withoutKey({ record: state.live, key: projectId }),
      picked: withoutKey({ record: state.picked, key: projectId }),
    })),
}));
