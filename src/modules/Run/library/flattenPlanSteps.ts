import type { ITestCase } from '@/modules/Plan';
import type { IFlatStep } from '@/modules/Run/types';

/**
 * Todo passo do plano em ordem de passeio, numerado como o caso dele o mostra; um passo
 * ainda sem nada a fazer fica de fora.
 */
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
