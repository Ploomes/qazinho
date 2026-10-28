import type { ISuiteChange } from '@/shared/types';

/**
 * As mudanças de um projeto depois que uma delas mudou: no lugar dela, ou nova, as mais
 * recentes primeiro.
 */
export function changesAfter(props: {
  changes: ISuiteChange[];
  change: ISuiteChange;
}): ISuiteChange[] {
  return [...props.changes.filter(({ id }) => id !== props.change.id), props.change].sort(
    (one, other) => other.startedAt - one.startedAt,
  );
}
