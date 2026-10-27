import type { IWalkedBy } from '@/modules/Workspace/types';
import type { IDetectedAgent, TargetKind } from '@/shared/types';
import { MODELS } from '@/modules/Settings/constants';
import { modelNameOf } from '@/modules/Settings/library';

/**
 * Who walks a run, in the names the QA reads: the agent, and its model by name, or the
 * one its own config names.
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
