import type { IVariablesStore } from './types';
import { create } from 'zustand';

export const useVariablesStore = create<IVariablesStore>((set) => ({
  byProject: {},
  request: null,
  settled: null,

  load: (projects) =>
    set({
      byProject: Object.fromEntries(
        projects.map(({ projectId, variables }) => [projectId, variables]),
      ),
    }),

  land: ({ projectId, variables }) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: variables } })),

  drop: (projectId) =>
    set((state) => ({
      byProject: Object.fromEntries(
        Object.entries(state.byProject).filter(([id]) => id !== projectId),
      ),
    })),

  ask: (request) =>
    set((state) => ({
      request,
      settled:
        state.request === null ? state.settled : { id: state.request.id, saved: null },
    })),

  settle: ({ id, saved }) =>
    set((state) =>
      state.request?.id === id ? { request: null, settled: { id, saved } } : {},
    ),
}));
