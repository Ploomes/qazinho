import { useTranslation } from 'react-i18next';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { Platform } from '@/services';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useStepDoneViewModel = () => {
  const { t } = useTranslation();
  const agents = useMachineStore((state) => state.agents);
  const tools = useMachineStore((state) => state.tools);
  const agentInUse = useSettingsStore((state) => state.agent);
  const integrations = useSetupStore((state) => state.integrations);
  const isMac = Platform.isMac();

  const agent = agents.find(({ name, isFound }) => isFound && name === agentInUse);
  const isIosReady = isMac && tools.xcode.isFound && tools.idb.isFound;

  return {
    rows: [
      {
        id: 'agent',
        label: t('SETUP.DONE_AGENT'),
        value: agent?.name ?? t('SETUP.DONE_NO_AGENT'),
        isReady: agent !== undefined,
      },
      {
        id: 'android',
        label: 'Android',
        value: tools.androidSdk.isFound
          ? t('SETUP.DONE_READY')
          : t('SETUP.DONE_NEEDS_SDK'),
        isReady: tools.androidSdk.isFound,
      },
      {
        id: 'ios',
        label: 'iOS',
        value: !isMac
          ? t('SETUP.MAC_ONLY')
          : isIosReady
            ? t('SETUP.DONE_READY')
            : t('SETUP.DONE_NEEDS_IOS'),
        isReady: isIosReady,
      },
      {
        id: 'trackers',
        label: t('SETUP.DONE_TRACKERS'),
        value:
          integrations.length === 0
            ? t('SETUP.DONE_NO_TRACKERS')
            : integrations
                .map(
                  (status) =>
                    `${INTEGRATIONS.find(({ id }) => id === status.id)?.name ?? status.id} · ${status.account}`,
                )
                .join(', '),
        isReady: integrations.length > 0,
      },
    ],
  };
};
