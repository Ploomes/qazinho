import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ABOUT_LINKS,
  LANGUAGES,
  SETTINGS_TABS,
  THEMES,
} from '@/modules/Settings/constants';
import { INTEGRATIONS, MCP_SERVERS, useAgentSignIn } from '@/modules/Setup';
import { Mcp, Platform } from '@/services';
import { useAppStore, useMachineStore, useSettingsStore, useSetupStore } from '@/store';

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
  const selectTab = useSettingsStore((state) => state.selectTab);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const selectLanguage = useSettingsStore((state) => state.selectLanguage);
  const landMcpServers = useSetupStore((state) => state.landMcpServers);
  const isMac = Platform.isMac();
  const signIn = useAgentSignIn();

  const agentId = detected.find(({ name }) => name === agent)?.id ?? 'claude-code';

  useEffect(() => {
    if (tab === 'mcps') void Mcp.list(agentId).then(landMcpServers);
  }, [tab, agentId, landMcpServers]);

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
      const note = !item.isFound
        ? t('SETTINGS.NOT_ON_PATH')
        : item.isSignedIn === false
          ? t('SETTINGS.NOT_SIGNED_IN')
          : isDefault
            ? t('SETTINGS.DEFAULT_AGENT')
            : t('SETTINGS.MAKE_DEFAULT');

      const canSignIn = item.isFound && item.isSignedIn === false;

      return {
        name: item.name,
        path: item.path ?? t('TOOLS.NOT_FOUND_PATH'),
        isFound: item.isFound,
        isDefault,
        note,
        canSignIn,
        className: [
          'settings__card',
          ...(isDefault ? ['settings__card--on'] : []),
          ...(canSignIn ? ['settings__card--signed-out'] : []),
        ].join(' '),
        onSignIn: () => {
          signIn.onSignIn(item.id);
        },
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
    integrations: INTEGRATIONS,
    mcpServers: MCP_SERVERS,
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
    signIn: signIn.signIn,
    signInAgent: signIn.signInAgent,
    onCancelSignIn: signIn.onCancelSignIn,
    onCloseSignIn: signIn.onCloseSignIn,
    onRetrySignIn: signIn.onRetrySignIn,
    onSignInCode: signIn.onSignInCode,
    onBack: closeSettings,
    onSelectTab: selectTab,
    onSelectAgent: selectAgent,
    onSelectTheme: setTheme,
    onSelectLanguage: selectLanguage,
    onEditKeybind: (keybindId: string) => {
      editKeybind(editingKeybindId === keybindId ? null : keybindId);
    },
  };
};
