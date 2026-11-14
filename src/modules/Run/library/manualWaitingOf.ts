import type { ITestCase } from '@/modules/Plan/types';
import type { IRun } from '@/modules/Run/types';
import { flattenPlanSteps } from './flattenPlanSteps';

/**
 * Os casos à mão que esperam o QA: os que ele não fez desde a última run do plano; nenhum
 * antes de o plano rodar.
 */
export function manualWaitingOf(props: { plan: ITestCase[]; runs: IRun[] }): string[] {
  const manual = [
    ...new Set(
      flattenPlanSteps(props.plan)
        .filter(({ caseIsManual }) => caseIsManual === true)
        .map(({ caseId }) => caseId),
    ),
  ];
  const latest = props.runs.findIndex(
    ({ kind, mode }) => kind !== 'explore' && mode !== 'manual',
  );

  if (latest === -1) return [];

  const since = props.runs.slice(0, latest);

  return manual.filter(
    (id) =>
      !since.some(({ cases }) =>
        cases.some(
          (walked) => walked.id === id && walked.steps.some(({ by }) => by === 'qa'),
        ),
      ),
  );
}
