import type { IMemoryChange } from '@/modules/Memory/types';
import type { IMemory, MemoryOp } from '@/shared/types';

/**
 * As memórias depois do que o agente pediu, e o que mudou: uma nova, uma corrigida, ou
 * uma esquecida, que perde o texto e fica com a data.
 */
export function withMemoryOps(props: {
  memories: IMemory[];
  ops: MemoryOp[];
  workspaceId: string;
  now: string;
  newId: () => string;
}): { memories: IMemory[]; changes: IMemoryChange[] } {
  const { ops, workspaceId, now, newId } = props;
  let memories = props.memories;
  const changes: IMemoryChange[] = [];

  for (const op of ops) {
    if (op.op === 'add') {
      if (memories.some((one) => isActive(one) && one.text === op.text)) continue;

      memories = [
        ...memories,
        {
          id: newId(),
          text: op.text,
          scope: op.scope,
          workspaceId: op.scope === 'plan' ? workspaceId : null,
          target: op.target,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];
      changes.push({ kind: 'added', text: op.text });
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
          : { ...one, text: '', updatedAt: now, deletedAt: now },
    );
    changes.push(
      op.op === 'replace'
        ? { kind: 'replaced', text: op.text }
        : { kind: 'forgotten', text: found.text },
    );
  }

  return { memories, changes };
}

function isActive({ deletedAt }: IMemory): boolean {
  return deletedAt === null;
}
