import type { ISuiteChange } from '@/modules/Automation/types';

/** O id da próxima mudança de um projeto, um acima do maior que ele tem: c-01, c-02… */
export function nextChangeId(changes: ISuiteChange[]): string {
  const highest = Math.max(
    0,
    ...changes.map(({ id }) => Number(/^c-(\d+)$/.exec(id)?.[1] ?? 0)),
  );

  return `c-${String(highest + 1).padStart(2, '0')}`;
}
