import { useTranslation } from 'react-i18next';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { useInstall, useMachineCheck } from '@/modules/Setup/hooks';
import { Platform } from '@/services';
import { useMachineStore, useSetupStore } from '@/store';

export const useStepDevicesViewModel = () => {
  const { t } = useTranslation();
  const tools = useMachineStore((state) => state.tools);
  const managers = useSetupStore((state) => state.managers);
  const { installs, install } = useInstall();
  const { isChecking, check } = useMachineCheck();
  const isMac = Platform.isMac();
  const hasBrew = managers?.brew.isFound ?? false;
  const idbInstall = installs.idb;

  const stateOf = (isFound: boolean) =>
    !isMac ? ('off' as const) : isFound ? ('found' as const) : ('missing' as const);
  const badgeOf = (isFound: boolean) =>
    !isMac ? t('SETUP.OFF') : isFound ? t('SETUP.FOUND') : t('SETUP.MISSING');

  return {
    isMac,
    isChecking,
    needsBrew: isMac && managers !== null && !hasBrew && !tools.idb.isFound,
    brewUrl: SETUP_LINKS.brew,
    android: {
      state: tools.androidSdk.isFound ? ('found' as const) : ('missing' as const),
      badge: tools.androidSdk.isFound ? t('SETUP.FOUND') : t('SETUP.MISSING'),
      detail: tools.androidSdk.path ?? t('SETUP.NOT_ON_MACHINE'),
      link: tools.androidSdk.isFound ? null : SETUP_LINKS.androidStudio,
    },
    xcode: {
      state: stateOf(tools.xcode.isFound),
      badge: badgeOf(tools.xcode.isFound),
      detail: isMac
        ? (tools.xcode.path ?? t('SETUP.NOT_ON_MACHINE'))
        : t('SETUP.MAC_ONLY'),
      link: isMac && !tools.xcode.isFound ? SETUP_LINKS.xcode : null,
    },
    idb: {
      state: stateOf(tools.idb.isFound),
      badge: badgeOf(tools.idb.isFound),
      detail: isMac ? (tools.idb.path ?? t('SETUP.NOT_ON_MACHINE')) : t('SETUP.MAC_ONLY'),
      canInstall:
        isMac && !tools.idb.isFound && hasBrew && idbInstall?.phase !== 'installing',
      install:
        idbInstall !== undefined && idbInstall.phase !== 'installed' ? idbInstall : null,
    },
    onInstallIdb: () => {
      void install('idb');
    },
    onCheckAgain: () => {
      void check();
    },
  };
};
