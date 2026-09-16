import type { SettingsTab } from '@/modules/Settings/types';
import { useTranslation } from 'react-i18next';
import { MODELS } from '@/modules/Settings/constants';
import { Platform } from '@/services';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

const LANGUAGES = [
  { id: 'en' as const, label: 'English' },
  { id: 'pt' as const, label: 'Português' },
];

const TABS: SettingsTab[] = [
  'agents',
  'devices',
  'integrations',
  'appearance',
  'shortcuts',
  'about',
];

export const useSettingsViewModel = () => {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const detected = useMachineStore((state) => state.agents);
  const tools = useMachineStore((state) => state.tools);
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
    agents: detected,
    agent,
    models: MODELS[agent] ?? [],
    model,
    language,
    languages: LANGUAGES,
    keybinds,
    integrations,
    androidSdk: {
      path: tools.androidSdk.path ?? t('TOOLS.NOT_FOUND_PATH'),
      note: tools.androidSdk.isFound
        ? t('TOOLS.ANDROID_FOUND')
        : t('TOOLS.ANDROID_MISSING'),
    },
    xcode: {
      path: tools.xcode.path ?? t('TOOLS.NOT_FOUND_PATH'),
      note: tools.xcode.isFound ? t('TOOLS.XCODE_FOUND') : t('TOOLS.XCODE_MISSING'),
    },
    isMac: Platform.isMac(),
    onSelectTab: selectTab,
    onSelectAgent: selectAgent,
    onSelectModel: selectModel,
    onSelectLanguage: selectLanguage,
    onToggleTheme: toggleTheme,
    onToggleIntegration: toggleIntegration,
  };
};
