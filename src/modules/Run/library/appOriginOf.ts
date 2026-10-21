import type { INetworkEntry } from '@/modules/Run/types';
import { urlPartsOf } from './urlPartsOf';

/** The origin of the app under test: where its first page came from, or its first request when it loaded none. */
export function appOriginOf(entries: INetworkEntry[]): string | null {
  const byStart = [...entries].sort((one, other) => one.startedAt - other.startedAt);
  const first = byStart.find(({ type }) => type === 'document') ?? byStart[0];

  return first === undefined ? null : urlPartsOf(first.url).origin;
}
