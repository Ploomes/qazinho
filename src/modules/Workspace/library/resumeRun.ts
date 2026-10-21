import type { ILiveRun, IWalkedBy, IWorkspace } from '@/modules/Workspace/types';
import type { IRunInFlight } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';
import { landFinding } from './landFinding';

/** A run main kept walking while the page was away: the page follows it again, its failures and side findings land on their bugs once, and the record saved as interrupted goes. */
export function resumeRun(props: {
  workspace: IWorkspace;
  run: IRunInFlight;
  now: number;
  startedAt: string;
  by: IWalkedBy;
}): IWorkspace {
  const { workspace, run, now, startedAt, by } = props;

  if (workspace.live && !workspace.live.isDone && workspace.live.id === run.runId)
    return workspace;

  const walking: IWorkspace = {
    ...workspace,
    runs: workspace.runs.filter(({ id }) => id !== run.runId),
    chat: workspace.chat.filter(
      (message) => message.kind !== 'run' || message.runId !== run.runId,
    ),
  };

  const live: ILiveRun = {
    id: run.runId,
    doingIndex: run.doingIndex,
    isRunning: !run.isPaused,
    isDone: false,
    elapsedSec: Math.max(0, Math.round((now - run.startedAtMs) / 1000)),
    startedAt,
    outcomes: run.outcomes,
    shot:
      run.outcomes.findLast(({ screenshot }) => screenshot !== null)?.screenshot ?? null,
    streamUrl: run.streamUrl,
    costUsd: run.costUsd,
    by,
    ...(run.isExploring ? { kind: 'explore' as const } : {}),
  };

  const failed = run.outcomes
    .filter(({ verdict }) => verdict === 'failed')
    .reduce<IWorkspace>(
      (current, outcome) => ({
        ...current,
        bugs: catchBug({
          workspace: current,
          outcome,
          outcomes: run.outcomes,
          isIncidental: false,
        }).bugs,
      }),
      { ...walking, status: 'running', live },
    );

  return run.findings.reduce<IWorkspace>(
    (current, finding) => landFinding({ workspace: current, finding, at: startedAt }),
    failed,
  );
}
