import type { ISuiteChange } from '@/modules/Automation/types';

/** The id of a project's next change, one past the highest it has: c-01, c-02… */
export function nextChangeId(changes: ISuiteChange[]): string {
  const highest = Math.max(
    0,
    ...changes.map(({ id }) => Number(/^c-(\d+)$/.exec(id)?.[1] ?? 0)),
  );

  return `c-${String(highest + 1).padStart(2, '0')}`;
}
