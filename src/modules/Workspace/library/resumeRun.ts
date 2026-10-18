import type { ILiveRun, IWorkspace } from '@/modules/Workspace/types';
import type { IRunInFlight } from '@/shared/types';
import { makeBug } from '@/modules/Bug/library';

/** A run main kept walking while the page was away: the page follows it again, its failures become bugs, and the record saved as interrupted goes. */
export function resumeRun(props: {
  workspace: IWorkspace;
  run: IRunInFlight;
  now: number;
  startedAt: string;
}): IWorkspace {
  const { workspace, run, now, startedAt } = props;

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
  };

  return run.outcomes
    .filter(({ verdict }) => verdict === 'failed')
    .filter(
      (outcome) =>
        !walking.bugs.some(
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
      { ...walking, status: 'running', live },
    );
}
