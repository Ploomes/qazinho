import { useTranslation } from 'react-i18next';
import { MODELS, useModelInUse } from '@/modules/Settings';
import { useDismiss } from '@/shared/hooks';
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
      note: defaultModel,
      isLocked: false,
    },
    ...(MODELS[agent] ?? []).map((one) => ({ ...one, note: null })),
  ];

  return {
    ref,
    agents: detected,
    agent,
    models,
    model,
    modelHeading: t('MODEL.MODEL'),
    onSelectAgent: selectAgent,
    onSelectModel: (id: string) => {
      selectModel(id);
      closeModelMenu();
    },
  };
};
