import type { ProSyncState } from '@/shared/types';

const GONE = new Set(['project_not_found', 'plan_not_found']);

/**
 * Em que pé a sincronização de um projeto fica depois de a plataforma recusar uma
 * chamada, pelo status que respondeu e o código.
 */
export function stateOfRefusal(answer: { status: number; error: string }): ProSyncState {
  if (answer.status === 0 || answer.status === 426) return 'waiting';
  if (answer.status === 401) return 'signed-out';
  if (answer.status === 402) return 'blocked';
  if (answer.status === 403) return 'read-only';
  if (answer.status === 404 && answer.error === 'org_not_found') return 'no-access';
  if (answer.status === 404 && GONE.has(answer.error)) return 'gone';
  if (answer.status >= 500) return 'waiting';

  return 'failed';
}
