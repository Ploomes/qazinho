import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  APP_VERSION,
  DIAGNOSTICS_COPIED_MS,
  LANGUAGES,
  RUN_ALERTS,
  SETTINGS_TABS,
  THEMES,
} from '@/modules/Settings/constants';
import {
  INTEGRATIONS,
  installableAgentOf,
  MCP_SERVERS,
  SETUP_LINKS,
  useAgentSignIn,
  useInstall,
  useMachineCheck,
} from '@/modules/Setup';
import { Diagnostics, Mcp, Platform } from '@/services';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';
import { useAppStore, useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useSettingsViewModel = () => {
  const [isCopied, setIsCopied] = useState(false);

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
  const runAlert = useSettingsStore((state) => state.runAlert);
  const selectRunAlert = useSettingsStore((state) => state.selectRunAlert);
  const isIslandOn = useSettingsStore((state) => state.isIslandOn);
  const showIsland = useSettingsStore((state) => state.showIsland);
  const landMcpServers = useSetupStore((state) => state.landMcpServers);
  const managers = useSetupStore((state) => state.managers);
  const isMac = Platform.isMac();
  const signIn = useAgentSignIn();
  const { installs, install } = useInstall();
  const { isChecking, check } = useMachineCheck();
  const axeInstall = installs.axe;
  const hasNpm = managers?.npm.isFound ?? false;

  const agentId = detected.find(({ name }) => name === agent)?.id ?? 'claude-code';

  useEffect(() => {
    if (tab === 'connections') void Mcp.list(agentId).then(landMcpServers);
  }, [tab, agentId, landMcpServers]);

  useEffect(() => {
    if (tab === 'agent' && managers === null && !isChecking) void check();
  }, [tab, managers, isChecking, check]);

  const toolState = (props: { isFound: boolean; isOn: boolean; path: string | null }) =>
    !props.isOn
      ? { state: 'off' as const, badge: t('SETUP.OFF'), detail: t('SETUP.MAC_ONLY') }
      : props.isFound
        ? {
            state: 'found' as const,
            badge: t('SETUP.FOUND'),
            detail: props.path ?? t('SETUP.NOT_ON_MACHINE'),
          }
        : {
            state: 'missing' as const,
            badge: t('SETUP.MISSING'),
            detail: t('SETUP.NOT_ON_MACHINE'),
          };

  return {
    tab,
    title: t(`SETTINGS.${tab.toUpperCase()}` as 'SETTINGS.AGENT'),
    tabs: SETTINGS_TABS.map((item) => ({
      id: item,
      label: t(`SETTINGS.${item.toUpperCase()}` as 'SETTINGS.AGENT'),
      isActive: item === tab,
    })),
    agents: detected.map((item) => {
      const isDefault = item.name === agent;
      const isSignedOut = item.isFound && item.isSignedIn === false;
      const installable = installableAgentOf(item.id);
      const state = installable === null ? undefined : installs[installable];

      return {
        name: item.name,
        state: item.isFound && !isSignedOut ? ('found' as const) : ('missing' as const),
        badge: !item.isFound
          ? t('SETUP.MISSING')
          : isDefault && !isSignedOut
            ? t('SETTINGS.DEFAULT_AGENT')
            : '',
        detail: !item.isFound
          ? t('SETUP.NOT_ON_MACHINE')
          : isSignedOut
            ? t('SETUP.NEEDS_SIGN_IN')
            : (item.path ?? ''),
        isDefault,
        canSignIn: isSignedOut,
        canInstall:
          !item.isFound &&
          installable !== null &&
          hasNpm &&
          state?.phase !== 'installing',
        install: state !== undefined && state.phase !== 'installed' ? state : null,
        onSignIn: () => {
          signIn.onSignIn(item.id);
        },
        onInstall: () => {
          if (installable !== null) void install(installable);
        },
      };
    }),
    agentsLabel: t('SETTINGS.AGENT'),
    needsNpm: managers !== null && !hasNpm && detected.some(({ isFound }) => !isFound),
    nodeUrl: SETUP_LINKS.nodejs,
    devices: [
      {
        name: 'Android SDK',
        ...toolState({
          isFound: tools.androidSdk.isFound,
          isOn: true,
          path: tools.androidSdk.path,
        }),
        hasLink: !tools.androidSdk.isFound,
        link: SETUP_LINKS.androidStudio,
        linkLabel: t('SETUP.GET_ANDROID_STUDIO'),
        canInstall: false,
        install: null,
      },
      {
        name: 'Xcode',
        ...toolState({
          isFound: tools.xcode.isFound,
          isOn: isMac,
          path: tools.xcode.path,
        }),
        hasLink: isMac && !tools.xcode.isFound,
        link: SETUP_LINKS.xcode,
        linkLabel: t('SETUP.GET_XCODE'),
        canInstall: false,
        install: null,
      },
      {
        name: 'AXe',
        ...toolState({ isFound: tools.axe.isFound, isOn: isMac, path: tools.axe.path }),
        hasLink: false,
        link: '',
        linkLabel: '',
        canInstall: isMac && !tools.axe.isFound && axeInstall?.phase !== 'installing',
        install:
          axeInstall !== undefined && axeInstall.phase !== 'installed'
            ? axeInstall
            : null,
      },
    ],
    onInstallAxe: () => {
      void install('axe');
    },
    integrations: INTEGRATIONS,
    mcpServers: MCP_SERVERS,
    themes: THEMES.map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      isActive: item.id === theme,
      swatch: { '--swatch': item.swatch, '--swatch-bar': item.bar } as CSSProperties,
    })),
    languages: LANGUAGES.map((item) => ({ ...item, isActive: item.id === language })),
    runAlerts: RUN_ALERTS.map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      className:
        item.id === runAlert
          ? 'settings__choice settings__choice--on'
          : 'settings__choice',
    })),
    keybinds: keybinds.map((item) => {
      const isEditing = item.id === editingKeybindId;

      return {
        id: item.id,
        label: t(item.labelKey),
        isEditing,
        keys: isEditing
          ? t('SETTINGS.PRESS_KEYS')
          : comboLabelOf({ combo: item.combo, isMac: Platform.isMac() }),
      };
    }),
    openLogsLabel: t('SETTINGS.LOGS_OPEN'),
    copyDiagnosticsLabel: isCopied
      ? t('SETTINGS.DIAGNOSTICS_COPIED')
      : t('SETTINGS.DIAGNOSTICS_COPY'),
    onOpenLogs: () => {
      void Diagnostics.openLogs();
    },
    onCopyDiagnostics: async () => {
      if (!(await Diagnostics.copy())) return;

      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, DIAGNOSTICS_COPIED_MS);
    },
    version: t('SETTINGS.ABOUT_VERSION', { version: APP_VERSION }),
    rights: t('SETTINGS.ABOUT_RIGHTS', { year: new Date().getFullYear() }),
    signIn: signIn.signIn,
    signInAgent: signIn.signInAgent,
    onCancelSignIn: signIn.onCancelSignIn,
    onCloseSignIn: signIn.onCloseSignIn,
    onRetrySignIn: signIn.onRetrySignIn,
    onBack: closeSettings,
    onSelectTab: selectTab,
    onSelectAgent: selectAgent,
    onSelectTheme: setTheme,
    onSelectLanguage: selectLanguage,
    onSelectRunAlert: selectRunAlert,
    islandLabel: t('SETTINGS.ISLAND'),
    isIslandOn,
    onIslandChange: showIsland,
    onEditKeybind: (keybindId: string) => {
      editKeybind(editingKeybindId === keybindId ? null : keybindId);
    },
  };
};
