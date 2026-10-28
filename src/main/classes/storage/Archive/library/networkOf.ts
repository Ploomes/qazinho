import type { INetworkEntry } from '@/shared/types';

/**
 * Os pedidos que o arquivo de uma run guarda, lidos de volta; um arquivo que não é uma
 * lista deles lê como nenhum.
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
