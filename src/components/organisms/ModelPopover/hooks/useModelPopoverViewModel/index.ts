import { useTranslation } from 'react-i18next';
import { AGENTS, MODELS } from '@/modules/Settings/constants';
import { useAppStore, useSettingsStore } from '@/store';

export const useModelPopoverViewModel = () => {
  const { t } = useTranslation();
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const selectModel = useSettingsStore((state) => state.selectModel);

  const models = MODELS[agent] ?? [];

  return {
    agents: AGENTS,
    agent,
    models,
    model,
    modelHeading: models.length === 0 ? t('MODEL.NO_MODELS') : t('MODEL.MODEL'),
    onSelectAgent: selectAgent,
    onSelectModel: selectModel,
    onClose: toggleModelMenu,
  };
};
