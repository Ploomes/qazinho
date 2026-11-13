import { useTranslation } from 'react-i18next';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { useInstall, useMachineCheck } from '@/modules/Setup/hooks';
import { Platform } from '@/services';
import { useMachineStore } from '@/store';

export const useStepDevicesViewModel = () => {
  const { t } = useTranslation();
  const tools = useMachineStore((state) => state.tools);
  const { installs, install } = useInstall();
  const { isChecking, check } = useMachineCheck();
  const isMac = Platform.isMac();
  const axeInstall = installs.axe;
  const hasMissing =
    !tools.androidSdk.isFound || (isMac && (!tools.xcode.isFound || !tools.axe.isFound));

  const stateOf = (isFound: boolean) =>
    !isMac ? ('off' as const) : isFound ? ('found' as const) : ('missing' as const);
  const badgeOf = (isFound: boolean) =>
    !isMac ? t('SETUP.OFF') : isFound ? t('SETUP.FOUND') : t('SETUP.MISSING');

  return {
    isChecking,
    hasNote: !isMac || !tools.androidSdk.isFound || !tools.xcode.isFound,
    note: isMac ? t('SETUP.DEVICES_NOTE') : t('SETUP.IOS_OFF_NOTE'),
    canCheckAgain: hasMissing,
    android: {
      state: tools.androidSdk.isFound ? ('found' as const) : ('missing' as const),
      badge: tools.androidSdk.isFound ? t('SETUP.FOUND') : t('SETUP.MISSING'),
      detail: tools.androidSdk.isFound ? undefined : t('SETUP.NOT_ON_MACHINE'),
      link: tools.androidSdk.isFound ? null : SETUP_LINKS.androidStudio,
    },
    xcode: {
      state: stateOf(tools.xcode.isFound),
      badge: badgeOf(tools.xcode.isFound),
      detail: !isMac
        ? t('SETUP.MAC_ONLY')
        : tools.xcode.isFound
          ? undefined
          : t('SETUP.NOT_ON_MACHINE'),
      link: isMac && !tools.xcode.isFound ? SETUP_LINKS.xcode : null,
    },
    axe: {
      state: stateOf(tools.axe.isFound),
      badge: badgeOf(tools.axe.isFound),
      detail: !isMac
        ? t('SETUP.MAC_ONLY')
        : tools.axe.isFound
          ? undefined
          : t('SETUP.NOT_ON_MACHINE'),
      canInstall: isMac && !tools.axe.isFound && axeInstall?.phase !== 'installing',
      install:
        axeInstall !== undefined && axeInstall.phase !== 'installed' ? axeInstall : null,
    },
    onInstallAxe: () => {
      void install('axe');
    },
    onCheckAgain: () => {
      void check();
    },
  };
};
