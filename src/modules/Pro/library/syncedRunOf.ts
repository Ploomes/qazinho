import type { ITarget } from '@/modules/Project/types';
import type { IRun } from '@/modules/Run/types';
import type { IProSyncRun } from '@/shared/types';
import { finishedVerdictOf } from './finishedVerdictOf';
import { startedIsoOf } from './startedIsoOf';

/** A finished run as QAzinho Pro takes it, on the target its workspace runs on, each step placed on its video; null for a run that does not know when it started. */
export function syncedRunOf(props: {
  workspaceId: string;
  run: IRun;
  target: ITarget;
}): IProSyncRun | null {
  const { workspaceId, run, target } = props;
  const startedAt = startedIsoOf(run);

  if (startedAt === null) return null;

  const video = run.video;
  const secondsOf = (at: number) =>
    video === null ? 0 : Math.max(0, Math.round((at - video.startedAt) / 10) / 100);

  return {
    workspaceId,
    runId: run.id,
    kind: run.kind ?? 'run',
    startedAt,
    durationSec: run.durationSec,
    endedBy: run.endedBy,
    target: { kind: target.kind, label: target.label, value: target.value },
    counts: run.counts,
    cases: run.cases.map((runCase) => ({
      id: runCase.id,
      title: runCase.title,
      verdict: finishedVerdictOf(runCase.verdict),
      durationSec: runCase.durationSec,
      steps: runCase.steps.map((step) => ({
        number: step.number,
        action: step.action,
        verdict: finishedVerdictOf(step.verdict),
        why: step.why,
        bugId: step.bugId,
        shotFile: step.shotFile,
        by: step.by ?? 'agent',
        proof: step.proof ?? null,
        span:
          video === null || step.span === null
            ? null
            : { from: secondsOf(step.span.from), to: secondsOf(step.span.to) },
      })),
    })),
    videoStartedAt: video === null ? null : new Date(video.startedAt).toISOString(),
    costUsd: run.costUsd,
  };
}
