import type { IMemoryChange } from '@/modules/Memory/types';
import type { IMemory, MemoryOp } from '@/shared/types';
import { overLimitOf } from './overLimitOf';

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
      const owner = op.scope === 'plan' ? workspaceId : null;

      if (
        memories.some(
          (one) =>
            isActive(one) &&
            one.text === op.text &&
            one.scope === op.scope &&
            one.workspaceId === owner,
        )
      )
        continue;

      const added: IMemory[] = [
        ...memories,
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
      const pushedOut = overLimitOf(added);

      memories = added.map((one) =>
        pushedOut.includes(one) ? forgotten(one, now) : one,
      );
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

function forgotten(memory: IMemory, now: string): IMemory {
  return { ...memory, text: '', updatedAt: now, deletedAt: now };
}

function isActive({ deletedAt }: IMemory): boolean {
  return deletedAt === null;
}
