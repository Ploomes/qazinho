import type { IMemory } from '@/shared/types';

/**
 * As memórias daqui juntas com as da org, cada uma na versão escrita por último; uma
 * apagada em qualquer lado continua apagada se foi o último a mexer nela.
 */
export function mergedMemoriesOf(props: { local: IMemory[]; org: IMemory[] }): IMemory[] {
  const merged = new Map(props.local.map((one) => [one.id, one]));

  for (const theirs of props.org) {
    const mine = merged.get(theirs.id);

    if (mine === undefined || theirs.updatedAt > mine.updatedAt)
      merged.set(theirs.id, theirs);
  }

  return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
