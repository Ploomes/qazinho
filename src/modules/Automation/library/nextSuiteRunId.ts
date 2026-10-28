import type { ISuiteRun } from '@/modules/Automation/types';

/**
 * O id da próxima run de suíte de um projeto, um acima do maior que ele tem: s-01, s-02…
 */
export function nextSuiteRunId(runs: ISuiteRun[]): string {
  const highest = Math.max(
    0,
    ...runs.map(({ id }) => Number(/^s-(\d+)$/.exec(id)?.[1] ?? 0)),
  );

  return `s-${String(highest + 1).padStart(2, '0')}`;
}
