import type { ILiveRun, IWalkedBy, IWorkspace } from '@/modules/Workspace/types';
import type { IRunInFlight } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';
import { landAnswered } from './landAnswered';
import { landFinding } from './landFinding';

/**
 * Acompanha uma run que a main continuou andando enquanto a página estava fora,
 * registrando os achados dela uma vez.
 */
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
    ...(run.how === undefined ? {} : { how: run.how }),
    isRunning: !run.isPaused,
    isDone: false,
    elapsedSec: Math.max(0, Math.round((now - run.startedAtMs) / 1000)),
    startedAt,
    startedAtMs: run.startedAtMs,
    outcomes: run.outcomes,
    shot:
      run.outcomes.findLast(({ screenshot }) => screenshot !== null)?.screenshot ?? null,
    streamUrl: run.streamUrl,
    ...(run.address === null ? {} : { address: run.address }),
    costUsd: run.costUsd,
    by,
    ...(run.isExploring ? { kind: 'explore' as const } : {}),
    ...(run.question === null
      ? {}
      : {
          question: {
            ...run.question,
            waitedSec: Math.max(0, Math.round((now - run.question.askedAtMs) / 1000)),
          },
        }),
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

  const found = run.findings.reduce<IWorkspace>(
    (current, finding) => landFinding({ workspace: current, finding, at: startedAt }),
    failed,
  );

  return run.asked.reduce<IWorkspace>(
    (current, asked) => landAnswered({ workspace: current, asked, at: startedAt }),
    found,
  );
}
