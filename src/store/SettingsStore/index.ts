import type { ISettingsStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveLanguage } from '@/languages/library';
import { KEYBINDS } from '@/modules/Settings/constants';
import { STORAGE } from '@/shared/constants';
import { keybindsOf, migrateSettings, rebind } from './library';

export const useSettingsStore = create<ISettingsStore>()(
  persist(
    (set) => ({
      tab: 'agents',
      agent: 'Claude Code',
      model: '',
      language: resolveLanguage(navigator.language),
      keybinds: KEYBINDS,
      editingKeybindId: null,
      hasOnboarded: false,
      runAlert: 'system',
      replayNetwork: false,
      isIslandOn: true,
      isSidebarShut: false,
      videoKeepDays: 30,

      selectTab: (tab) => set({ tab }),

      selectAgent: (agent) =>
        set((state) => (state.agent === agent ? {} : { agent, model: '' })),

      selectModel: (model) => set({ model }),

      selectLanguage: (language) => set({ language }),

      editKeybind: (editingKeybindId) => set({ editingKeybindId }),

      setKeybind: ({ keybindId, combo }) =>
        set((state) => ({
          editingKeybindId: null,
          keybinds: rebind({ keybinds: state.keybinds, keybindId, combo }),
        })),

      finishOnboarding: () => set({ hasOnboarded: true }),

      selectRunAlert: (runAlert) => set({ runAlert }),

      showReplayNetwork: (replayNetwork) => set({ replayNetwork }),

      showIsland: (isIslandOn) => set({ isIslandOn }),

      toggleSidebar: () => set((state) => ({ isSidebarShut: !state.isSidebarShut })),

      keepVideosFor: (videoKeepDays) => set({ videoKeepDays }),
    }),
    {
      name: STORAGE.settings,
      version: 1,
      migrate: (persisted, version) =>
        migrateSettings({ persisted, version }) as Pick<
          ISettingsStore,
          | 'agent'
          | 'model'
          | 'language'
          | 'keybinds'
          | 'hasOnboarded'
          | 'runAlert'
          | 'replayNetwork'
          | 'isIslandOn'
          | 'isSidebarShut'
          | 'videoKeepDays'
        >,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ISettingsStore>;

        return {
          ...current,
          ...saved,
          keybinds: keybindsOf({ saved: saved.keybinds, table: KEYBINDS }),
        };
      },
      partialize: ({
        agent,
        model,
        language,
        keybinds,
        hasOnboarded,
        runAlert,
        replayNetwork,
        isIslandOn,
        isSidebarShut,
        videoKeepDays,
      }) => ({
        agent,
        model,
        language,
        keybinds,
        hasOnboarded,
        runAlert,
        replayNetwork,
        isIslandOn,
        isSidebarShut,
        videoKeepDays,
      }),
    },
  ),
);
