import type { IUsageRecord } from '@/shared/types';

/** Todos os tokens de um gasto: entrada, saída, e os lidos e escritos no cache. */
export function tokensOf(
  record: Pick<IUsageRecord, 'input' | 'output' | 'cacheRead' | 'cacheWrite'>,
): number {
  return record.input + record.output + record.cacheRead + record.cacheWrite;
}
