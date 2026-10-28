import type { IBug } from '@/modules/Bug/types';
import { appearancesOf } from './appearancesOf';

/** Se uma run pegou este bug, a primeira vez ou de novo. */
export function isSeenIn(props: { bug: IBug; runId: string }): boolean {
  return appearancesOf(props.bug).some(({ runId }) => runId === props.runId);
}
