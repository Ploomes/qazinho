import type { ITestCase } from '@/modules/Plan/types';
import type { IPlanStage } from '@/modules/Run/types';
import { flattenPlanSteps } from './flattenPlanSteps';

/**
 * Em que etapa um plano está: os casos que já têm gravação e os que ainda faltam
 * desenvolver, sem contar um caso sem nenhum passo a andar.
 */
export function planStageOf(props: {
  plan: ITestCase[];
  developed: string[];
}): IPlanStage {
  const walkable = [...new Set(flattenPlanSteps(props.plan).map(({ caseId }) => caseId))];
  const developed = walkable.filter((id) => props.developed.includes(id));

  return {
    total: walkable.length,
    developed,
    toDevelop: walkable.filter((id) => !props.developed.includes(id)),
  };
}
