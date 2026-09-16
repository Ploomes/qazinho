import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ABOUT_LINKS,
  INTEGRATIONS,
  LANGUAGES,
  SETTINGS_TABS,
  THEMES,
} from '@/modules/Settings/constants';
import { Platform } from '@/services';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

export const useSettingsViewModel = () => {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const detected = useMachineStore((state) => state.agents);
  const tools = useMachineStore((state) => state.tools);
  const tab = useSettingsStore((state) => state.tab);
  const agent = useSettingsStore((state) => state.agent);
  const language = useSettingsStore((state) => state.language);
  const keybinds = useSettingsStore((state) => state.keybinds);
  const editingKeybindId = useSettingsStore((state) => state.editingKeybindId);
  const editKeybind = useSettingsStore((state) => state.editKeybind);
  const integrations = useSettingsStore((state) => state.integrations);
  const selectTab = useSettingsStore((state) => state.selectTab);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const selectLanguage = useSettingsStore((state) => state.selectLanguage);
  const toggleIntegration = useSettingsStore((state) => state.toggleIntegration);
  const isMac = Platform.isMac();

  const iosTool = (props: {
    name: string;
    isFound: boolean;
    path: string;
    found: string;
    missing: string;
  }) =>
    isMac
      ? {
          name: props.name,
          isFound: props.isFound,
          glyph: props.isFound ? '✓' : '!',
          path: props.path,
          status: props.isFound ? props.found : props.missing,
        }
      : {
          name: props.name,
          isFound: false,
          glyph: '!',
          path: t('PROJECT.IOS_MAC_ONLY'),
          status: t('SETTINGS.IOS_OFF'),
        };

  return {
    tab,
    title: t(`SETTINGS.${tab.toUpperCase()}` as 'SETTINGS.AGENTS'),
    tabs: SETTINGS_TABS.map((item) => ({
      id: item,
      label: t(`SETTINGS.${item.toUpperCase()}` as 'SETTINGS.AGENTS'),
      isActive: item === tab,
    })),
    agents: detected.map((item) => {
      const isDefault = item.name === agent;

      return {
        name: item.name,
        path: item.path ?? t('TOOLS.NOT_FOUND_PATH'),
        isFound: item.isFound,
        isDefault,
        note: !item.isFound
          ? t('SETTINGS.NOT_ON_PATH')
          : isDefault
            ? t('SETTINGS.DEFAULT_AGENT')
            : t('SETTINGS.MAKE_DEFAULT'),
      };
    }),
    devices: [
      {
        name: 'Android SDK',
        isFound: tools.androidSdk.isFound,
        glyph: tools.androidSdk.isFound ? '✓' : '!',
        path: tools.androidSdk.path ?? t('TOOLS.NOT_FOUND_PATH'),
        status: tools.androidSdk.isFound
          ? t('TOOLS.ANDROID_FOUND')
          : t('TOOLS.ANDROID_MISSING'),
      },
      iosTool({
        name: 'Xcode',
        isFound: tools.xcode.isFound,
        path: tools.xcode.path ?? t('TOOLS.NOT_FOUND_PATH'),
        found: t('TOOLS.XCODE_FOUND'),
        missing: t('TOOLS.XCODE_MISSING'),
      }),
      iosTool({
        name: 'idb',
        isFound: tools.idb.isFound,
        path: tools.idb.path ?? t('TOOLS.IDB_INSTALL'),
        found: t('TOOLS.IDB_FOUND'),
        missing: t('TOOLS.IDB_MISSING'),
      }),
    ],
    integrations: INTEGRATIONS.map((item) => {
      const isConnected = integrations[item.id];

      return {
        id: item.id,
        name: item.name,
        logo: item.logo,
        text: t(item.textKey),
        needs: t(item.needsKey),
        isConnected,
        pill: isConnected ? ('passed' as const) : ('idle' as const),
        status: isConnected ? t('SETTINGS.CONNECTED') : t('SETTINGS.NOT_CONNECTED'),
        action: isConnected ? t('COMMON.DISCONNECT') : t('COMMON.CONNECT'),
        rows: item.rows.map((row) => ({
          label: t(row.labelKey),
          value: t(row.valueKey),
        })),
      };
    }),
    themes: THEMES.map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      isActive: item.id === theme,
      swatch: { '--swatch': item.swatch, '--swatch-bar': item.bar } as CSSProperties,
    })),
    languages: LANGUAGES.map((item) => ({ ...item, isActive: item.id === language })),
    keybinds: keybinds.map((item) => {
      const isEditing = item.id === editingKeybindId;

      return {
        id: item.id,
        label: item.label,
        isEditing,
        keys: isEditing ? t('SETTINGS.PRESS_KEYS') : item.combo,
      };
    }),
    links: ABOUT_LINKS,
    onBack: closeSettings,
    onSelectTab: selectTab,
    onSelectAgent: selectAgent,
    onSelectTheme: setTheme,
    onSelectLanguage: selectLanguage,
    onToggleIntegration: toggleIntegration,
    onEditKeybind: (keybindId: string) => {
      editKeybind(editingKeybindId === keybindId ? null : keybindId);
    },
  };
};
