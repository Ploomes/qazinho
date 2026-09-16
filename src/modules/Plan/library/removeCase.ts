import type { ITestCase } from '@/modules/Plan/types';

export function removeCase(props: { plan: ITestCase[]; caseId: string }): ITestCase[] {
  return props.plan.filter((testCase) => testCase.id !== props.caseId);
}
