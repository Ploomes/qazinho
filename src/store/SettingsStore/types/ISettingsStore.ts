import type { IKeybind, RunAlert, SettingsTab } from '@/modules/Settings';
import type { Language } from '@/shared/types';

/**
 * O que o QA configurou nesta máquina: o agente, os dispositivos, os atalhos e por quanto
 * tempo os vídeos ficam.
 */
export interface ISettingsStore {
  tab: SettingsTab;
  agent: string;
  model: string;
  language: Language;
  keybinds: IKeybind[];
  editingKeybindId: string | null;
  hasOnboarded: boolean;
  runAlert: RunAlert;
  replayNetwork: boolean;
  isSidebarShut: boolean;
  videoKeepDays: number | null;
  selectTab: (tab: SettingsTab) => void;
  selectAgent: (agent: string) => void;
  selectModel: (model: string) => void;
  selectLanguage: (language: Language) => void;
  editKeybind: (keybindId: string | null) => void;
  setKeybind: (props: { keybindId: string; combo: string }) => void;
  finishOnboarding: () => void;
  selectRunAlert: (runAlert: RunAlert) => void;
  showReplayNetwork: (isOn: boolean) => void;
  toggleSidebar: () => void;
  keepVideosFor: (days: number | null) => void;
}
