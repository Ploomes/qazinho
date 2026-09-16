import type { ITestCase } from '@/modules/Plan/types';
import { mapCase } from './mapCase';

export function addStep(props: { plan: ITestCase[]; caseId: string }): ITestCase[] {
  return mapCase({
    ...props,
    change: (testCase) => ({
      ...testCase,
      steps: [...testCase.steps, { action: '', expected: '' }],
    }),
  });
}
