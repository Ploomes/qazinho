import type { ISettingsStore } from './types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LEGACY_STORAGE, STORAGE } from '@/constants';
import { resolveLanguage } from '@/languages/library';
import { KEYBINDS } from '@/modules/Settings/constants';
import { withLegacyKeys } from '@/store/library';
import { migrateSettings } from './library';

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

      selectTab: (tab) => set({ tab }),

      selectAgent: (agent) =>
        set((state) => (state.agent === agent ? {} : { agent, model: '' })),

      selectModel: (model) => set({ model }),

      selectLanguage: (language) => set({ language }),

      editKeybind: (editingKeybindId) => set({ editingKeybindId }),

      setKeybind: ({ keybindId, combo }) =>
        set((state) => ({
          editingKeybindId: null,
          keybinds: state.keybinds.map((keybind) =>
            keybind.id === keybindId ? { ...keybind, combo } : keybind,
          ),
        })),

      finishOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: STORAGE.settings,
      storage: createJSONStorage(() =>
        withLegacyKeys({ storage: localStorage, legacy: LEGACY_STORAGE }),
      ),
      version: 1,
      migrate: (persisted, version) =>
        migrateSettings({ persisted, version }) as Pick<
          ISettingsStore,
          'agent' | 'model' | 'language' | 'keybinds' | 'hasOnboarded'
        >,
      partialize: ({ agent, model, language, keybinds, hasOnboarded }) => ({
        agent,
        model,
        language,
        keybinds,
        hasOnboarded,
      }),
    },
  ),
);
