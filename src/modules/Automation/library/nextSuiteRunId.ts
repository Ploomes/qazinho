import type { ISuiteRun } from '@/modules/Automation/types';

/** The id of a project's next suite run, one past the highest it has: s-01, s-02… */
export function nextSuiteRunId(runs: ISuiteRun[]): string {
  const highest = Math.max(
    0,
    ...runs.map(({ id }) => Number(/^s-(\d+)$/.exec(id)?.[1] ?? 0)),
  );

  return `s-${String(highest + 1).padStart(2, '0')}`;
}
