import type { IBugSighting } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome } from '@/shared/types';

/**
 * O passo que pegou um bug de novo, como uma vista da run que anda agora, com a tela que
 * o mostrou.
 */
export function sightingOf(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
}): IBugSighting {
  const { workspace, outcome } = props;

  return {
    runId: workspace.live?.id ?? 'r-01',
    runWhen: workspace.live?.startedAt ?? '',
    caseId: outcome.caseId,
    stepNumber: outcome.stepNumber,
    at: outcome.at,
    shot: { isBad: true, src: outcome.screenshot, file: outcome.shotFile },
  };
}
