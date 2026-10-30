import type { IWalkedBy, IWorkspace } from '@/modules/Workspace/types';

/** Inicia uma run do plano, ou uma exploração, que não precisa de plano para ir. */
export function startRun(props: {
  workspace: IWorkspace;
  startedAt: string;
  startedAtMs?: number;
  runId: string;
  by: IWalkedBy;
  kind?: 'explore';
  caseIds?: string[];
}): IWorkspace {
  const { workspace, startedAt, startedAtMs, runId, by, kind, caseIds } = props;

  if (workspace.plan.length === 0 && kind !== 'explore') return workspace;

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
      ...(startedAtMs === undefined ? {} : { startedAtMs }),
      outcomes: [],
      shot: null,
      streamUrl: null,
      costUsd: null,
      by,
      ...(kind === undefined ? {} : { kind }),
      ...(caseIds === undefined ? {} : { caseIds }),
    },
  };
}
