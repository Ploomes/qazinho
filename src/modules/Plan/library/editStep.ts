import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import { mapCase } from './mapCase';

/** O QA conserta o que o agente errou; um passo é a menor coisa que ele pode mudar. */
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
