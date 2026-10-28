import type { IProShare } from '@/shared/types';

const STOPPED = new Set<IProShare['state']>(['off', 'gone', 'no-access']);

/**
 * Se o vínculo de um projeto ainda leva o que muda aqui: ligado a uma org que ainda o
 * guarda e que esta pessoa ainda alcança.
 */
export function isSendingShare(share: IProShare): boolean {
  return share.orgSlug !== null && !STOPPED.has(share.state);
}
