import type { IBug, IBugCatch } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome } from '@/shared/types';
import { bugSeenAgain } from './bugSeenAgain';
import { isSeenIn } from './isSeenIn';
import { makeBug } from './makeBug';
import { openBugFor } from './openBugFor';
import { sightingOf } from './sightingOf';

/**
 * A failed step or a finding as it lands among the bugs: on the open bug it is, or as a
 * new one.
 */
export function catchBug(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  outcomes: IStepOutcome[];
  isIncidental: boolean;
}): IBugCatch {
  const { workspace, outcome, outcomes, isIncidental } = props;
  const open = openBugFor({
    bugs: workspace.bugs,
    sameAs: outcome.sameAs,
    caseId: outcome.caseId,
    stepNumber: outcome.stepNumber,
    title: outcome.title,
    isIncidental,
  });

  if (open === null) {
    const bug = { ...makeBug({ workspace, outcome, outcomes }), isIncidental };

    return { bugs: [...workspace.bugs, bug], bugId: bug.id, how: 'new' };
  }

  if (isSeenIn({ bug: open, runId: workspace.live?.id ?? 'r-01' }))
    return {
      bugs:
        plannedIf({ bug: open, isIncidental }) === open
          ? workspace.bugs
          : workspace.bugs.map((bug) =>
              bug.id === open.id ? plannedIf({ bug, isIncidental }) : bug,
            ),
      bugId: open.id,
      how: 'repeat',
    };

  const sighting = sightingOf({ workspace, outcome });

  return {
    bugs: workspace.bugs.map((bug) =>
      bug.id === open.id
        ? plannedIf({ bug: bugSeenAgain({ bug, sighting }), isIncidental })
        : bug,
    ),
    bugId: open.id,
    how: 'again',
  };
}

function plannedIf(props: { bug: IBug; isIncidental: boolean }): IBug {
  return props.isIncidental || !props.bug.isIncidental
    ? props.bug
    : { ...props.bug, isIncidental: false };
}
