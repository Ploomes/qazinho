import type { ITestCase } from '@/modules/Plan/types';
import { nextCaseId } from './nextCaseId';

/**
 * O plano com os casos de um plan.yaml relido acrescentados depois, cada um com o id para
 * o qual runs e bugs apontam, a menos que um caso novo o tenha pego.
 */
export function planWithRestored(props: {
  plan: ITestCase[];
  restored: ITestCase[];
}): ITestCase[] {
  const reserved = props.restored.map(({ id }) => id);

  return props.restored.reduce<ITestCase[]>((plan, testCase) => {
    const taken = plan.map(({ id }) => id);

    return [
      ...plan,
      taken.includes(testCase.id)
        ? { ...testCase, id: nextCaseId([...taken, ...reserved]) }
        : testCase,
    ];
  }, props.plan);
}
