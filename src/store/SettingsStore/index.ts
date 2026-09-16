import type { ISettingsStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE } from '@/constants';
import { KEYBINDS, MODELS } from '@/modules/Settings/constants';

export const useSettingsStore = create<ISettingsStore>()(
  persist(
    (set) => ({
      tab: 'agents',
      agent: 'Claude Code',
      model: 'sonnet',
      language: 'en',
      keybinds: KEYBINDS,
      editingKeybindId: null,
      integrations: { github: false, jira: false },

      selectTab: (tab) => set({ tab }),

      selectAgent: (agent) => set({ agent, model: MODELS[agent]?.[0]?.id ?? '' }),

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

      toggleIntegration: (name) =>
        set((state) => ({
          integrations: { ...state.integrations, [name]: !state.integrations[name] },
        })),
    }),
    {
      name: STORAGE.settings,
      partialize: ({ agent, model, language, keybinds, integrations }) => ({
        agent,
        model,
        language,
        keybinds,
        integrations,
      }),
    },
  ),
);
