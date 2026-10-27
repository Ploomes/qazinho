import type { ProSyncState } from '@/shared/types';

const GONE = new Set(['project_not_found', 'plan_not_found']);

/**
 * Where a project's sync stands after the platform refused a call, by the status it
 * answered and its code.
 */
export function stateOfRefusal(answer: { status: number; error: string }): ProSyncState {
  if (answer.status === 0) return 'waiting';
  if (answer.status === 401) return 'signed-out';
  if (answer.status === 402) return 'blocked';
  if (answer.status === 403) return 'read-only';
  if (answer.status === 404 && answer.error === 'org_not_found') return 'no-access';
  if (answer.status === 404 && GONE.has(answer.error)) return 'gone';
  if (answer.status >= 500) return 'waiting';

  return 'failed';
}
