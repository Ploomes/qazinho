import type { ITestCase } from '@/modules/Plan/types';
import type { IProSyncCase } from '@/shared/types';

/**
 * Um caso do plano como o QAzinho Pro o guarda: o que cobre e os passos, sem como a
 * última run foi.
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
