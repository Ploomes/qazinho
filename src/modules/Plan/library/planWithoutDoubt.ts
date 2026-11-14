import type { ITestCase } from '@/modules/Plan/types';

/** O plano sem uma dúvida que o QA tirou: nenhum caso espera mais por ela. */
export function planWithoutDoubt(props: { plan: ITestCase[]; id: string }): ITestCase[] {
  return props.plan.map((testCase) =>
    testCase.blockedBy?.includes(props.id) === true
      ? { ...testCase, blockedBy: testCase.blockedBy.filter((id) => id !== props.id) }
      : testCase,
  );
}
