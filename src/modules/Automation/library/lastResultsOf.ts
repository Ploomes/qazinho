import type { ILastResult, ISuiteRun } from '@/modules/Automation/types';

/**
 * How each test went the last time a run reached it, read from a project's runs, the
 * latest first.
 */
export function lastResultsOf(runs: ISuiteRun[]): Record<string, ILastResult> {
  const last: Record<string, ILastResult> = {};

  for (const run of runs)
    for (const result of run.results)
      if (!(result.testId in last))
        last[result.testId] = { result, runId: run.id, endedAt: run.endedAt };

  return last;
}
