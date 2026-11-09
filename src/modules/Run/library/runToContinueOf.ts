import type { ITestCase } from '@/modules/Plan/types';
import type { IRun, IRunCase, IRunToContinue } from '@/modules/Run/types';
import { flattenPlanSteps } from './flattenPlanSteps';

/**
 * A última run, quando o QAzinho fechou no meio dela, com os casos que ela não terminou;
 * null quando não há o que continuar.
 */
export function runToContinueOf(props: {
  plan: ITestCase[];
  runs: IRun[];
}): IRunToContinue | null {
  const [latest] = props.runs;

  if (latest === undefined || latest.endedBy !== 'interrupted') return null;

  if (latest.kind === 'explore') return null;

  const scope = props.plan.filter(
    ({ id }) => latest.caseIds === undefined || latest.caseIds.includes(id),
  );
  const caseIds = [
    ...new Set(flattenPlanSteps(scope).map(({ caseId }) => caseId)),
  ].filter((id) => !isFinished(latest.cases.find((runCase) => runCase.id === id)));

  return caseIds.length === 0
    ? null
    : { runId: latest.id, mode: latest.mode ?? 'replay', caseIds };
}

function isFinished(walked: IRunCase | undefined): boolean {
  if (walked === undefined) return false;

  const reached = walked.steps.filter(({ span }) => span !== null);
  const last = reached.at(-1)?.verdict;

  return (
    reached.length === walked.steps.length || last === 'failed' || last === 'blocked'
  );
}
