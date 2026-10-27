import type { INetworkEntry } from '@/shared/types';

/**
 * The requests a run's file keeps, read back; a file that is not a list of them reads as
 * none.
 */
export function networkOf(text: string): INetworkEntry[] {
  try {
    const read: unknown = JSON.parse(text);

    return Array.isArray(read) ? read.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function isEntry(value: unknown): value is INetworkEntry {
  if (typeof value !== 'object' || value === null) return false;

  const entry = value as Record<string, unknown>;
  const isNumberOrNull = (field: unknown) => field === null || typeof field === 'number';

  return (
    typeof entry.id === 'number' &&
    typeof entry.method === 'string' &&
    typeof entry.url === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.startedAt === 'number' &&
    isNumberOrNull(entry.status) &&
    isNumberOrNull(entry.durationMs) &&
    isNumberOrNull(entry.size) &&
    (entry.failure === null || typeof entry.failure === 'string')
  );
}
