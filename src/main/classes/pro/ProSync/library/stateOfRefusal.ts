import type { ProSyncState } from '@/shared/types';

/** Where a project's sync stands after the platform refused a call, by the status it answered. */
export function stateOfRefusal(answer: { status: number; error: string }): ProSyncState {
  if (answer.status === 0) return 'waiting';
  if (answer.status === 401) return 'signed-out';
  if (answer.status === 402) return 'blocked';
  if (answer.status === 403) return 'read-only';
  if (answer.status >= 500) return 'waiting';

  return 'failed';
}
