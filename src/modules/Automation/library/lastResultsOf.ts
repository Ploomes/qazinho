import type { ILastResult, ISuiteRun } from '@/modules/Automation/types';

/**
 * Como cada teste foi na última vez que uma run o alcançou, lido das runs de um projeto,
 * as mais recentes primeiro.
 */
export function lastResultsOf(runs: ISuiteRun[]): Record<string, ILastResult> {
  const last: Record<string, ILastResult> = {};

  for (const run of runs)
    for (const result of run.results)
      if (!(result.testId in last))
        last[result.testId] = { result, runId: run.id, endedAt: run.endedAt };

  return last;
}
