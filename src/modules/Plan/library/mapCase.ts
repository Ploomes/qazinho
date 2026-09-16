import type { ITestCase } from '@/modules/Plan/types';

export function mapCase(props: {
  plan: ITestCase[];
  caseId: string;
  change: (testCase: ITestCase) => ITestCase;
}): ITestCase[] {
  const { plan, caseId, change } = props;

  return plan.map((testCase) => (testCase.id === caseId ? change(testCase) : testCase));
}
