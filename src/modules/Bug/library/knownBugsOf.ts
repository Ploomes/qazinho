import type { IBug } from '@/modules/Bug/types';
import type { IKnownBug } from '@/shared/types';

/** The bugs open in a workspace as a run's agents hear of them: by id, title and where they were first caught; one the QA said is no bug is not told. */
export function knownBugsOf(bugs: IBug[]): IKnownBug[] {
  return bugs
    .filter(({ isDismissed }) => !isDismissed)
    .map(({ id, title, caseId, stepNumber, isIncidental }) => ({
      id,
      title,
      caseId,
      stepNumber,
      isIncidental,
    }));
}
