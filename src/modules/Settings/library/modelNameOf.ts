import type { IModelOption } from '@/modules/Settings/types';

/**
 * What to call the model in use: the one picked, or the one the agent's own config names;
 * null when neither is known.
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
