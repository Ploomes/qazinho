import type { ISetupStore } from './types';
import { create } from 'zustand';
import { installAfter } from './library';

export const useSetupStore = create<ISetupStore>((set) => ({
  managers: null,
  isChecking: false,
  installs: {},
  integrations: [],
  mcpServers: null,

  startChecking: () => set({ isChecking: true }),

  landCheck: (managers) => set({ managers, isChecking: false }),

  startInstall: (item) =>
    set((state) => ({
      installs: {
        ...state.installs,
        [item]: { phase: 'installing', stage: 1, stages: 1, line: '' },
      },
    })),

  followInstall: (event) =>
    set((state) => ({
      installs: {
        ...state.installs,
        [event.item]: installAfter({ state: state.installs[event.item], news: event }),
      },
    })),

  finishInstall: ({ item, result }) =>
    set((state) => ({
      installs: {
        ...state.installs,
        [item]: installAfter({ state: state.installs[item], news: result }),
      },
    })),

  setIntegrations: (integrations) => set({ integrations }),

  landMcpServers: (mcpServers) => set({ mcpServers }),

  landIntegration: (status) =>
    set((state) => ({
      integrations: [...state.integrations.filter(({ id }) => id !== status.id), status],
    })),

  dropIntegration: (id) =>
    set((state) => ({
      integrations: state.integrations.filter((integration) => integration.id !== id),
    })),
}));
