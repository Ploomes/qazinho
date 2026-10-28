import type { IModelOption } from '@/modules/Settings/types';

/**
 * Como chamar o modelo em uso: o escolhido, ou o que a própria config do agente nomeia;
 * null quando nenhum é conhecido.
 */
export function modelNameOf(props: {
  model: string;
  defaultModel: string | null;
  models: IModelOption[];
}): string | null {
  const { model, defaultModel, models } = props;

  if (model.length === 0) return defaultModel;

  return models.find(({ id }) => id === model)?.name ?? model;
}
