import type { ITestCase } from '@/modules/Plan/types';
import type { IProSyncCase } from '@/shared/types';

/**
 * Um caso do plano como o QAzinho Pro o guarda: o que cobre, a conta em que começa, os
 * passos e se é à mão, sem como a última run foi.
 */
export function syncedCaseOf(testCase: ITestCase): IProSyncCase {
  const { id, title, priority, goal, preconditions, steps } = testCase;

  return {
    id,
    title,
    priority,
    goal,
    preconditions,
    ...(testCase.signedInAs === undefined ? {} : { signedInAs: testCase.signedInAs }),
    steps: steps.map(({ action, expected, frame }) =>
      frame === undefined ? { action, expected } : { action, expected, frame },
    ),
    ...(testCase.isManual === true ? { isManual: true } : {}),
    ...(testCase.sources === undefined || testCase.sources.length === 0
      ? {}
      : { sources: testCase.sources }),
    ...(testCase.blockedBy === undefined || testCase.blockedBy.length === 0
      ? {}
      : { blockedBy: testCase.blockedBy }),
  };
}
