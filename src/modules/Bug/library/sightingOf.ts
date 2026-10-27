import type { IBugSighting } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome } from '@/shared/types';

/**
 * The step that caught a bug again, as a sighting of the run walking now, with the screen
 * that showed it.
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
