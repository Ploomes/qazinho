import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import { mapCase } from './mapCase';

/** The QA fixes what the agent got wrong; a step is the smallest thing they can change. */
export function editStep(props: {
  plan: ITestCase[];
  caseId: string;
  index: number;
  step: Partial<ITestStep>;
}): ITestCase[] {
  const { plan, caseId, index, step } = props;

  return mapCase({
    plan,
    caseId,
    change: (testCase) => ({
      ...testCase,
      steps: testCase.steps.map((one, at) => (at === index ? { ...one, ...step } : one)),
    }),
  });
}
