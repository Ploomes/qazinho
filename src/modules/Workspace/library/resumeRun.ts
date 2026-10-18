import type { ILiveRun, IWorkspace } from '@/modules/Workspace/types';
import type { IRunInFlight } from '@/shared/types';
import { makeBug } from '@/modules/Bug/library';

/** A run main kept walking while the page was away: the page follows it again, and its failures become bugs. */
export function resumeRun(props: {
  workspace: IWorkspace;
  run: IRunInFlight;
  now: number;
  startedAt: string;
}): IWorkspace {
  const { workspace, run, now, startedAt } = props;

  if (workspace.live && !workspace.live.isDone && workspace.live.id === run.runId)
    return workspace;

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
  };

  return run.outcomes
    .filter(({ verdict }) => verdict === 'failed')
    .filter(
      (outcome) =>
        !workspace.bugs.some(
          (bug) =>
            bug.runId === run.runId &&
            bug.caseId === outcome.caseId &&
            bug.step === `step ${String(outcome.stepNumber)}`,
        ),
    )
    .reduce<IWorkspace>(
      (current, outcome) => ({
        ...current,
        bugs: [
          ...current.bugs,
          makeBug({ workspace: current, outcome, outcomes: run.outcomes }),
        ],
      }),
      { ...workspace, status: 'running', live },
    );
}
