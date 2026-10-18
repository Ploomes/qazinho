import type { IKeybind, SettingsTab } from '@/modules/Settings';
import type { Language } from '@/shared/types';

/** What the QA has set up on this machine: the agent, the devices and the shortcuts. */
export interface ISettingsStore {
  tab: SettingsTab;
  agent: string;
  model: string;
  language: Language;
  keybinds: IKeybind[];
  editingKeybindId: string | null;
  hasOnboarded: boolean;
  selectTab: (tab: SettingsTab) => void;
  selectAgent: (agent: string) => void;
  selectModel: (model: string) => void;
  selectLanguage: (language: Language) => void;
  editKeybind: (keybindId: string | null) => void;
  setKeybind: (props: { keybindId: string; combo: string }) => void;
  finishOnboarding: () => void;
}
