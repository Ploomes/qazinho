import type { ISettingsStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveLanguage } from '@/languages/library';
import { KEYBINDS } from '@/modules/Settings/constants';
import { STORAGE } from '@/shared/constants';
import { keybindsOf, migrateSettings } from './library';

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
      version: 1,
      migrate: (persisted, version) =>
        migrateSettings({ persisted, version }) as Pick<
          ISettingsStore,
          'agent' | 'model' | 'language' | 'keybinds' | 'hasOnboarded'
        >,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ISettingsStore>;

        return {
          ...current,
          ...saved,
          keybinds: keybindsOf({ saved: saved.keybinds, table: KEYBINDS }),
        };
      },
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
