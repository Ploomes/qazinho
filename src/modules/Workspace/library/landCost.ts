import type { IWorkspace } from '@/modules/Workspace/types';

/** One case's agent said what it cost: the run in flight adds it up. */
export function landCost(props: { workspace: IWorkspace; costUsd: number }): IWorkspace {
  const { workspace, costUsd } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  return { ...workspace, live: { ...live, costUsd: (live.costUsd ?? 0) + costUsd } };
}
