import type { ITestCase } from '@/modules/Plan/types';
import type { IProSyncCase } from '@/shared/types';

/**
 * Casos da org como o plano do workspace, cada um mantendo como foi a última run dele
 * aqui quando este computador a tem.
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
    ...(one.signedInAs === undefined ? {} : { signedInAs: one.signedInAs }),
    steps: one.steps.map(({ action, expected, frame }) =>
      frame === undefined ? { action, expected } : { action, expected, frame },
    ),
    lastVerdict: props.local.find(({ id }) => id === one.id)?.lastVerdict ?? null,
    ...(one.isManual === true ? { isManual: true } : {}),
    ...(one.sources === undefined || one.sources.length === 0
      ? {}
      : { sources: one.sources }),
    ...(one.blockedBy === undefined || one.blockedBy.length === 0
      ? {}
      : { blockedBy: one.blockedBy }),
  }));
}
