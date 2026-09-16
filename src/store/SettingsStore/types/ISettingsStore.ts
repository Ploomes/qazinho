import type { IKeybind, SettingsTab } from '@/modules/Settings/types';

/** What the QA has set up on this machine: the agent, the devices and the shortcuts. */
export interface ISettingsStore {
  tab: SettingsTab;
  agent: string;
  model: string;
  language: string;
  keybinds: IKeybind[];
  editingKeybindId: string | null;
  integrations: { github: boolean; jira: boolean };
  selectTab: (tab: SettingsTab) => void;
  selectAgent: (agent: string) => void;
  selectModel: (model: string) => void;
  selectLanguage: (language: string) => void;
  editKeybind: (keybindId: string | null) => void;
  setKeybind: (props: { keybindId: string; combo: string }) => void;
  toggleIntegration: (name: 'github' | 'jira') => void;
}
