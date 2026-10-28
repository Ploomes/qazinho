import type { IWorkspace } from '@/modules/Workspace/types';

/** O agente de um caso disse quanto custou: a run em andamento soma. */
export function landCost(props: { workspace: IWorkspace; costUsd: number }): IWorkspace {
  const { workspace, costUsd } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  return { ...workspace, live: { ...live, costUsd: (live.costUsd ?? 0) + costUsd } };
}
