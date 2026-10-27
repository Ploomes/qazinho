import type { ITestCase } from '@/modules/Plan/types';
import type { IProSyncCase } from '@/shared/types';

/**
 * A case of the plan as QAzinho Pro keeps it: what it covers and its steps, without how
 * the last run went.
 */
export function syncedCaseOf(testCase: ITestCase): IProSyncCase {
  const { id, title, priority, goal, preconditions, steps } = testCase;

  return {
    id,
    title,
    priority,
    goal,
    preconditions,
    steps: steps.map(({ action, expected, frame }) =>
      frame === undefined ? { action, expected } : { action, expected, frame },
    ),
  };
}
