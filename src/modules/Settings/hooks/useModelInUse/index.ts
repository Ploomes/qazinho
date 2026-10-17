import { useTranslation } from 'react-i18next';
import { MODELS } from '@/modules/Settings/constants';
import { modelNameOf } from '@/modules/Settings/library';
import { useMachineStore, useSettingsStore } from '@/store';

export const useModelInUse = () => {
  const { t } = useTranslation();
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const detected = useMachineStore((state) => state.agents);

  const defaultModel = detected.find(({ name }) => name === agent)?.defaultModel ?? null;

  return {
    agent,
    model,
    defaultModel,
    modelName:
      modelNameOf({ model, defaultModel, models: MODELS[agent] ?? [] }) ??
      t('MODEL.AGENT_DEFAULT'),
  };
};
