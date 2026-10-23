import type { ITestCase } from '@/modules/Plan/types';
import { nextCaseId } from './nextCaseId';

/** The plan with the cases of a plan.yaml read again added after it, each keeping its id, the one its runs and bugs point at, unless a case written since took it. */
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
