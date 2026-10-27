import type { ISuiteChange } from '@/shared/types';

/**
 * A project's changes once one of them changed: in its place, or new, the latest first.
 */
export function changesAfter(props: {
  changes: ISuiteChange[];
  change: ISuiteChange;
}): ISuiteChange[] {
  return [...props.changes.filter(({ id }) => id !== props.change.id), props.change].sort(
    (one, other) => other.startedAt - one.startedAt,
  );
}
