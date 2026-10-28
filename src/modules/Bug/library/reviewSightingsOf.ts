import type { IBug, IBugSighting } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { INetworkEntry, IReviewSighting } from '@/shared/types';
import { BUG_REPORT } from '@/modules/Bug/constants';

/**
 * Cada vez que um bug registrado voltou, como o agente revisor a lê: run, passo, nota,
 * tela, pedidos.
 */
export function reviewSightingsOf(props: {
  workspace: IWorkspace;
  bug: IBug;
  sightings: IBugSighting[];
  failed: Record<string, INetworkEntry[]>;
}): IReviewSighting[] {
  const { workspace, bug } = props;

  return props.sightings.map((seen) => {
    const step = workspace.runs
      .find(({ id }) => id === seen.runId)
      ?.cases.find(({ id }) => id === seen.caseId)
      ?.steps.find(({ number }) => number === seen.stepNumber);

    return {
      runId: seen.runId,
      runWhen: seen.runWhen,
      caseId: seen.caseId,
      stepNumber: seen.stepNumber,
      action: step?.action ?? bug.repro.find(({ isBad }) => isBad)?.action ?? '',
      note: step?.why ?? '',
      target: bug.target,
      shot: seen.shot.file,
      requests: (props.failed[seen.runId] ?? []).map(
        (entry) =>
          `${entry.method} ${entry.url} → ${entry.status === null ? (entry.failure ?? 'no answer') : String(entry.status)}${entry.body === undefined ? '' : `: ${entry.body.replace(/\s+/g, ' ').slice(0, BUG_REPORT.answerLength)}`}`,
      ),
    };
  });
}
