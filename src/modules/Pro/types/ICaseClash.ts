import type { IProSyncCase } from '@/shared/types';

/**
 * A case this computer and the org both changed since they last agreed, each side as it
 * stands; null for the side that deleted it.
 */
export interface ICaseClash {
  id: string;
  mine: IProSyncCase | null;
  theirs: IProSyncCase | null;
}
