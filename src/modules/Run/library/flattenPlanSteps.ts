import type { ITestCase } from '@/modules/Plan';
import type { IFlatStep } from '@/modules/Run/types';

export function flattenPlanSteps(plan: ITestCase[]): IFlatStep[] {
  return plan.flatMap((testCase) =>
    testCase.steps.map((step, index) => ({
      caseId: testCase.id,
      caseTitle: testCase.title,
      numberInCase: index + 1,
      action: step.action,
      expected: step.expected,
    })),
  );
}
