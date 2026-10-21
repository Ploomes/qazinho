import type { IBug } from '@/modules/Bug/types';
import { appearancesOf } from './appearancesOf';

/** Whether a run caught this bug, the first time or again. */
export function isSeenIn(props: { bug: IBug; runId: string }): boolean {
  return appearancesOf(props.bug).some(({ runId }) => runId === props.runId);
}
