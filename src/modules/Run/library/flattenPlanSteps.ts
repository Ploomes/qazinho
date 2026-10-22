import type { ITestCase } from '@/modules/Plan';
import type { IFlatStep } from '@/modules/Run/types';

/** Every step of the plan in walking order, numbered as its case shows it; a step with nothing to do yet is left out. */
export function flattenPlanSteps(plan: ITestCase[]): IFlatStep[] {
  return plan.flatMap((testCase) =>
    testCase.steps
      .map((step, index) => ({
        caseId: testCase.id,
        caseTitle: testCase.title,
        casePriority: testCase.priority,
        caseGoal: testCase.goal,
        casePreconditions: testCase.preconditions,
        numberInCase: index + 1,
        action: step.action,
        expected: step.expected,
        ...(step.frame === undefined ? {} : { frame: step.frame }),
      }))
      .filter((step) => step.action.trim().length > 0),
  );
}
