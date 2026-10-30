import type { ITestCase } from '@/modules/Plan';
import type { IFlatStep } from '@/modules/Run/types';
import { flattenPlanSteps } from './flattenPlanSteps';

/**
 * Os passos que uma run anda: os do plano inteiro, ou só os dos casos que o QA escolheu
 * rodar.
 */
export function walkedStepsOf(props: {
  plan: ITestCase[];
  caseIds: string[] | undefined;
}): IFlatStep[] {
  const { plan, caseIds } = props;

  return flattenPlanSteps(
    caseIds === undefined ? plan : plan.filter(({ id }) => caseIds.includes(id)),
  );
}
