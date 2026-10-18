import type { IWalkedBy, IWorkspace } from '@/modules/Workspace/types';

export function startRun(props: {
  workspace: IWorkspace;
  startedAt: string;
  runId: string;
  by: IWalkedBy;
}): IWorkspace {
  const { workspace, startedAt, runId, by } = props;

  if (workspace.plan.length === 0) return workspace;

  return {
    ...workspace,
    status: 'running',
    bugs: workspace.bugs.map((bug) => ({ ...bug, isNew: false })),
    live: {
      id: runId,
      doingIndex: -1,
      isRunning: true,
      isDone: false,
      elapsedSec: 0,
      startedAt,
      outcomes: [],
      shot: null,
      streamUrl: null,
      costUsd: null,
      by,
    },
  };
}
