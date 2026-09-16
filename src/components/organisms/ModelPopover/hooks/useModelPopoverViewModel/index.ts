import { useTranslation } from 'react-i18next';
import { useDismiss } from '@/hooks';
import { MODELS } from '@/modules/Settings/constants';
import { useModelInUse } from '@/modules/Settings/hooks';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

export const useModelPopoverViewModel = () => {
  const { t } = useTranslation();
  const closeModelMenu = useAppStore((state) => state.closeModelMenu);
  const detected = useMachineStore((state) => state.agents);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const selectModel = useSettingsStore((state) => state.selectModel);

  const ref = useDismiss<HTMLDivElement>(closeModelMenu);

  const { defaultModel } = useModelInUse();
  const models = [
    {
      id: '',
      name: t('MODEL.AGENT_DEFAULT'),
      note: defaultModel ?? t('MODEL.AGENT_DEFAULT_UNKNOWN'),
      isLocked: false,
    },
    ...(MODELS[agent] ?? []),
  ];

  const agents = detected.map((one) => ({
    ...one,
    note: one.isFound
      ? one.name === agent
        ? t('MODEL.DEFAULT')
        : t('MODEL.FOUND')
      : t('MODEL.NOT_FOUND'),
  }));

  return {
    ref,
    agents,
    agent,
    models,
    model,
    modelHeading: t('MODEL.MODEL'),
    onSelectAgent: selectAgent,
    onSelectModel: selectModel,
  };
};
