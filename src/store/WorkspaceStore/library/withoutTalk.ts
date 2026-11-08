import type { ILiveRun } from '@/modules/Workspace/types';

/** A run em andamento depois de o agente responder o que o QA disse. */
export function withoutTalk(live: ILiveRun): ILiveRun {
  const { talk: _talk, ...rest } = live;

  return rest;
}
