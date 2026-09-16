import type { SettingsTab } from '@/modules/Settings/types';
import { MACHINE } from '@/modules/Project/constants';
import { AGENTS, MODELS } from '@/modules/Settings/constants';
import { Platform } from '@/services';
import { useAppStore, useSettingsStore } from '@/store';

const TABS: SettingsTab[] = [
  'agents',
  'devices',
  'integrations',
  'appearance',
  'shortcuts',
  'about',
];

export const useSettingsViewModel = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const tab = useSettingsStore((state) => state.tab);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const language = useSettingsStore((state) => state.language);
  const keybinds = useSettingsStore((state) => state.keybinds);
  const integrations = useSettingsStore((state) => state.integrations);
  const selectTab = useSettingsStore((state) => state.selectTab);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const selectModel = useSettingsStore((state) => state.selectModel);
  const selectLanguage = useSettingsStore((state) => state.selectLanguage);
  const toggleIntegration = useSettingsStore((state) => state.toggleIntegration);

  return {
    tabs: TABS,
    tab,
    theme,
    agents: AGENTS,
    agent,
    models: MODELS[agent] ?? [],
    model,
    language,
    keybinds,
    integrations,
    androidSdk: MACHINE.androidSdk,
    xcode: MACHINE.xcode,
    isMac: Platform.isMac(),
    onSelectTab: selectTab,
    onSelectAgent: selectAgent,
    onSelectModel: selectModel,
    onSelectLanguage: selectLanguage,
    onToggleTheme: toggleTheme,
    onToggleIntegration: toggleIntegration,
  };
};
