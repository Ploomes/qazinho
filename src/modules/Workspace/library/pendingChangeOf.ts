import type { IPendingChange } from '@/modules/Plan/types';
import { snapshotsOf } from './snapshotsOf';

/** A mudança ainda por resolver que um arquivo salvo guarda, ou null. */
export function pendingChangeOf(saved: unknown): IPendingChange | null {
  const read = (saved ?? {}) as Record<string, unknown>;

  if (
    !Array.isArray(read.found) ||
    read.found.length === 0 ||
    typeof read.at !== 'string'
  )
    return null;

  const code = read.code as IPendingChange['code'] | undefined;

  return {
    found: read.found as IPendingChange['found'],
    snapshots: snapshotsOf(read.snapshots),
    code: typeof code?.commit === 'string' ? code : null,
    at: read.at,
  };
}
