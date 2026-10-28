import type { IWalkedBy } from '@/modules/Workspace/types';
import type { IDetectedAgent, TargetKind } from '@/shared/types';
import { MODELS } from '@/modules/Settings/constants';
import { modelNameOf } from '@/modules/Settings/library';

/**
 * Quem anda uma run, nos nomes que o QA lê: o agente, e o modelo dele pelo nome, ou o que
 * a própria config dele nomeia.
 */
export function walkedByOf(props: {
  agent: string;
  model: string;
  targetKind: TargetKind;
  agents: IDetectedAgent[];
}): IWalkedBy {
  const { agent, model, targetKind, agents } = props;
  const defaultModel = agents.find(({ name }) => name === agent)?.defaultModel ?? null;

  return {
    agent,
    modelName: modelNameOf({ model, defaultModel, models: MODELS[agent] ?? [] }),
    targetKind,
  };
}
