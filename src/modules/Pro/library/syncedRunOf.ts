import type { ITarget } from '@/modules/Project/types';
import type { IRun } from '@/modules/Run/types';
import type { IProSyncRun } from '@/shared/types';
import { finishedVerdictOf } from './finishedVerdictOf';
import { startedIsoOf } from './startedIsoOf';
import { videoSecondsOf } from './videoSecondsOf';

/**
 * Uma run terminada como o QAzinho Pro a aceita, no alvo em que o workspace dela roda,
 * cada passo posto no vídeo dela; null para uma run que não sabe quando começou.
 */
export function syncedRunOf(props: {
  workspaceId: string;
  run: IRun;
  target: ITarget;
}): IProSyncRun | null {
  const { workspaceId, run, target } = props;
  const startedAt = startedIsoOf(run);

  if (startedAt === null) return null;

  const video = run.video;

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
            : {
                from: videoSecondsOf({ at: step.span.from, startedAt: video.startedAt }),
                to: videoSecondsOf({ at: step.span.to, startedAt: video.startedAt }),
              },
      })),
    })),
    videoStartedAt: video === null ? null : new Date(video.startedAt).toISOString(),
    costUsd: run.costUsd,
  };
}
