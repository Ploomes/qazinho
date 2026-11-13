import type { ITestCase } from '@/modules/Plan/types';
import type { IPlanStage } from '@/modules/Run/types';
import { flattenPlanSteps } from './flattenPlanSteps';

/**
 * Em que etapa um plano está: os casos que já têm gravação, os que faltam desenvolver e
 * os feitos à mão, sem contar um caso sem nenhum passo a andar.
 */
export function planStageOf(props: {
  plan: ITestCase[];
  developed: string[];
}): IPlanStage {
  const steps = flattenPlanSteps(props.plan);
  const walkable = [...new Set(steps.map(({ caseId }) => caseId))];
  const manual = new Set(
    steps.filter(({ caseIsManual }) => caseIsManual === true).map(({ caseId }) => caseId),
  );
  const automated = walkable.filter((id) => !manual.has(id));

  return {
    total: automated.length,
    developed: automated.filter((id) => props.developed.includes(id)),
    toDevelop: automated.filter((id) => !props.developed.includes(id)),
    manual: walkable.filter((id) => manual.has(id)),
  };
}
