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
    steps: one.steps.map(({ action, expected, frame }) =>
      frame === undefined ? { action, expected } : { action, expected, frame },
    ),
    lastVerdict: props.local.find(({ id }) => id === one.id)?.lastVerdict ?? null,
  }));
}
