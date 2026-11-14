import type { IWalkedBy, IWorkspace } from '@/modules/Workspace/types';
import type { RunMode } from '@/shared/types';

/**
 * Inicia uma run do plano, que encerra a espera da história, ou uma exploração, que não
 * precisa de plano para ir.
 */
export function startRun(props: {
  workspace: IWorkspace;
  startedAt: string;
  startedAtMs?: number;
  runId: string;
  by: IWalkedBy;
  kind?: 'explore';
  caseIds?: string[];
  mode?: RunMode;
}): IWorkspace {
  const { workspace, startedAt, startedAtMs, runId, by, kind, caseIds, mode } = props;

  if (workspace.plan.length === 0 && kind !== 'explore') return workspace;

  const { storyStage: _stage, ...walked } = workspace;

  return {
    ...(kind === 'explore' || mode === 'manual' ? workspace : walked),
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
      ...(mode === undefined ? {} : { mode }),
    },
  };
}
