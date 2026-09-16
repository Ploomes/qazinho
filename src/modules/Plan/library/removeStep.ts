import type { ITestCase } from '@/modules/Plan/types';
import { mapCase } from './mapCase';

/** A case with no steps is not a case, so the last one stays. */
export function removeStep(props: {
  plan: ITestCase[];
  caseId: string;
  index: number;
}): ITestCase[] {
  const { plan, caseId, index } = props;

  return mapCase({
    plan,
    caseId,
    change: (testCase) =>
      testCase.steps.length < 2
        ? testCase
        : { ...testCase, steps: testCase.steps.filter((_step, at) => at !== index) },
  });
}
