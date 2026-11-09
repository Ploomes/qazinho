import type { IMemory } from '@/shared/types';
import { overLimitOf } from './overLimitOf';

/**
 * As memórias daqui juntas com as da org, cada uma na versão mais nova, dentro do limite;
 * uma que a org já sabe que foi esquecida não precisa mais ficar aqui.
 */
export function mergedMemoriesOf(props: {
  local: IMemory[];
  org: IMemory[];
  now: string;
}): IMemory[] {
  const merged = new Map(props.local.map((one) => [one.id, one]));

  for (const theirs of props.org) {
    const mine = merged.get(theirs.id);

    if (theirs.deletedAt !== null) {
      if (mine !== undefined && theirs.updatedAt >= mine.updatedAt)
        merged.delete(theirs.id);

      continue;
    }

    if (mine === undefined || theirs.updatedAt > mine.updatedAt)
      merged.set(theirs.id, theirs);
  }

  const list = [...merged.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const over = overLimitOf(list);

  return list.map((one) =>
    over.includes(one)
      ? { ...one, text: '', updatedAt: props.now, deletedAt: props.now }
      : one,
  );
}
