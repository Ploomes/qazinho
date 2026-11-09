import type { IMemoryChange } from '@/modules/Memory/types';
import type { IMemory, MemoryOp, MemoryScope } from '@/shared/types';
import { MEMORY_LIMIT } from '@/shared/constants';

/**
 * As memórias depois do que o agente pediu, e o que mudou; uma esquecida perde o texto e
 * fica com a data. Sem lugar para uma nova, sai a que está parada há mais tempo.
 */
export function withMemoryOps(props: {
  memories: IMemory[];
  ops: MemoryOp[];
  workspaceId: string;
  now: string;
  newId: () => string;
}): { memories: IMemory[]; changes: IMemoryChange[] } {
  const { workspaceId, now, newId } = props;
  let memories = props.memories;
  const changes: IMemoryChange[] = [];

  for (const op of changesBeforeAdds(props.ops)) {
    if (op.op === 'add') {
      if (memories.some((one) => isActive(one) && one.text === op.text)) continue;

      const owner = op.scope === 'plan' ? workspaceId : null;
      const pushedOut = pushedOutBy({ memories, scope: op.scope, owner });

      memories = [
        ...memories.map((one) => (pushedOut.includes(one) ? forgotten(one, now) : one)),
        {
          id: newId(),
          text: op.text,
          scope: op.scope,
          workspaceId: owner,
          target: op.target,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];
      changes.push(
        ...pushedOut.map(({ text }) => ({ kind: 'forgotten' as const, text })),
        { kind: 'added', text: op.text },
      );
      continue;
    }

    const found = memories.find((one) => one.id === op.id && isActive(one));

    if (found === undefined) continue;

    memories = memories.map((one) =>
      one.id !== op.id
        ? one
        : op.op === 'replace'
          ? {
              ...one,
              text: op.text,
              target: op.target ?? one.target,
              updatedAt: now,
            }
          : forgotten(one, now),
    );
    changes.push(
      op.op === 'replace'
        ? { kind: 'replaced', text: op.text }
        : { kind: 'forgotten', text: found.text },
    );
  }

  return { memories, changes };
}

function changesBeforeAdds(ops: MemoryOp[]): MemoryOp[] {
  return [
    ...ops.filter(({ op }) => op !== 'add'),
    ...ops.filter(({ op }) => op === 'add'),
  ];
}

function pushedOutBy(props: {
  memories: IMemory[];
  scope: MemoryScope;
  owner: string | null;
}): IMemory[] {
  const { scope, owner } = props;
  const inScope = props.memories
    .filter((one) => isActive(one) && one.scope === scope && one.workspaceId === owner)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  return inScope.slice(0, Math.max(0, inScope.length - MEMORY_LIMIT[scope] + 1));
}

function forgotten(memory: IMemory, now: string): IMemory {
  return { ...memory, text: '', updatedAt: now, deletedAt: now };
}

function isActive({ deletedAt }: IMemory): boolean {
  return deletedAt === null;
}
