import type { INetworkEntry } from '@/modules/Run/types';
import { urlPartsOf } from './urlPartsOf';

/**
 * A origem do app sob teste: de onde veio a primeira página dele, ou o primeiro pedido
 * quando não carregou nenhuma.
 */
export function appOriginOf(entries: INetworkEntry[]): string | null {
  const byStart = [...entries].sort((one, other) => one.startedAt - other.startedAt);
  const first = byStart.find(({ type }) => type === 'document') ?? byStart[0];

  return first === undefined ? null : urlPartsOf(first.url).origin;
}
