import type { IProSyncCase } from '@/shared/types';

/**
 * Um caso que este computador e a org mudaram desde que concordaram por último, cada lado
 * como está; null para o lado que o apagou.
 */
export interface ICaseClash {
  id: string;
  mine: IProSyncCase | null;
  theirs: IProSyncCase | null;
}
