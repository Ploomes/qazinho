import type { IProShare } from '@/shared/types';

const STOPPED = new Set<IProShare['state']>(['off', 'gone', 'no-access']);

/**
 * Whether a project's link still takes what changes here: linked to an org that still
 * holds it and that this person still reaches.
 */
export function isSendingShare(share: IProShare): boolean {
  return share.orgSlug !== null && !STOPPED.has(share.state);
}
