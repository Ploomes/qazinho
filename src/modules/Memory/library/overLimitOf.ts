import type { IMemory } from '@/shared/types';
import { MEMORY_LIMIT } from '@/shared/constants';

/** O que sobra em cada lista além do limite dela, as paradas há mais tempo primeiro. */
export function overLimitOf(memories: IMemory[]): IMemory[] {
  const lists = new Map<string, IMemory[]>();

  for (const memory of memories) {
    if (memory.deletedAt !== null) continue;

    const list = memory.scope === 'plan' ? `plan:${memory.workspaceId ?? ''}` : 'project';

    lists.set(list, [...(lists.get(list) ?? []), memory]);
  }

  return [...lists.values()].flatMap((list) => {
    const limit = MEMORY_LIMIT[list[0]?.scope ?? 'project'];

    return [...list]
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, Math.max(0, list.length - limit));
  });
}
