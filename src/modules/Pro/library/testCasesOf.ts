import type { ITestCase } from '@/modules/Plan/types';
import type { IProSyncCase } from '@/shared/types';

/**
 * Cases from the org as the workspace's plan, each keeping how its last run went here
 * when this computer has it.
 */
export function testCasesOf(props: {
  cases: IProSyncCase[];
  local: ITestCase[];
}): ITestCase[] {
  return props.cases.map((one) => ({
    id: one.id,
    title: one.title,
    priority: one.priority,
    goal: one.goal,
    preconditions: one.preconditions,
    steps: one.steps.map(({ action, expected, frame }) =>
      frame === undefined ? { action, expected } : { action, expected, frame },
    ),
    lastVerdict: props.local.find(({ id }) => id === one.id)?.lastVerdict ?? null,
  }));
}
