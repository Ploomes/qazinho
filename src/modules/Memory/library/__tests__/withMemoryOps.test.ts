import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { withMemoryOps } from '@/modules/Memory/library';
import { MEMORY_LIMIT } from '@/shared/constants';

const NOW = '2026-11-08T12:00:00.000Z';
const OLD = '2026-11-01T12:00:00.000Z';
const memory: IMemory = {
  id: 'm-1',
  text: 'Em Ajustes.',
  scope: 'project',
  workspaceId: null,
  target: 'all',
  createdAt: OLD,
  updatedAt: OLD,
  deletedAt: null,
};
const apply = (
  ops: Parameters<typeof withMemoryOps>[0]['ops'],
  memories: IMemory[] = [memory],
) => withMemoryOps({ memories, ops, workspaceId: 'w-1', now: NOW, newId: () => 'm-new' });
const fullOf = (over: Partial<IMemory>, count: number): IMemory[] =>
  Array.from({ length: count }, (_, index) => ({
    ...memory,
    ...over,
    id: `m-${String(index)}`,
    text: `Fato ${String(index)}.`,
    updatedAt: `2026-10-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
  }));
const ADD_TO_PROJECT = {
  op: 'add',
  text: 'Fato novo.',
  scope: 'project',
  target: 'all',
} as const;
const ADD_TO_PLAN = { ...ADD_TO_PROJECT, scope: 'plan' } as const;
const activeOf = (memories: IMemory[]) =>
  memories.filter((one) => one.deletedAt === null);

describe('withMemoryOps', () => {
  it('forgets the one unchanged the longest to fit a new one in a full project', () => {
    const { memories, changes } = apply(
      [ADD_TO_PROJECT],
      fullOf({}, MEMORY_LIMIT.project),
    );

    expect(activeOf(memories)).toHaveLength(MEMORY_LIMIT.project);
    expect(memories.find(({ id }) => id === 'm-0')).toMatchObject({
      text: '',
      deletedAt: NOW,
    });
    expect(changes).toEqual([
      { kind: 'forgotten', text: 'Fato 0.' },
      { kind: 'added', text: 'Fato novo.' },
    ]);
  });

  it('adds with nothing forgotten while the scope has room', () => {
    const { memories, changes } = apply(
      [ADD_TO_PROJECT],
      fullOf({}, MEMORY_LIMIT.project - 1),
    );

    expect(activeOf(memories)).toHaveLength(MEMORY_LIMIT.project);
    expect(changes).toEqual([{ kind: 'added', text: 'Fato novo.' }]);
  });

  it('counts a plan apart from the project and from other plans', () => {
    const others = [
      ...fullOf({}, MEMORY_LIMIT.project),
      ...fullOf({ scope: 'plan', workspaceId: 'w-2' }, MEMORY_LIMIT.plan).map((one) => ({
        ...one,
        id: `other-${one.id}`,
      })),
    ];

    expect(apply([ADD_TO_PLAN], others).changes).toEqual([
      { kind: 'added', text: 'Fato novo.' },
    ]);
  });

  it('fills a plan up to its own limit, forgetting only from that plan', () => {
    const { memories, changes } = apply(
      [ADD_TO_PLAN],
      fullOf({ scope: 'plan', workspaceId: 'w-1' }, MEMORY_LIMIT.plan),
    );

    expect(activeOf(memories)).toHaveLength(MEMORY_LIMIT.plan);
    expect(changes[0]).toEqual({ kind: 'forgotten', text: 'Fato 0.' });
  });

  it('lets a delete in the same answer make the room, whatever the order', () => {
    const { changes } = apply(
      [ADD_TO_PROJECT, { op: 'delete', id: 'm-5' }],
      fullOf({}, MEMORY_LIMIT.project),
    );

    expect(changes).toEqual([
      { kind: 'forgotten', text: 'Fato 5.' },
      { kind: 'added', text: 'Fato novo.' },
    ]);
  });

  it('never counts one already forgotten against the limit', () => {
    const memories = [
      ...fullOf({}, MEMORY_LIMIT.project - 1),
      { ...memory, id: 'gone', text: '', deletedAt: OLD },
    ];

    expect(apply([ADD_TO_PROJECT], memories).changes).toEqual([
      { kind: 'added', text: 'Fato novo.' },
    ]);
  });

  it('corrects a fact in a full project with nothing forgotten', () => {
    const { changes } = apply(
      [{ op: 'replace', id: 'm-3', text: 'Fato corrigido.' }],
      fullOf({}, MEMORY_LIMIT.project),
    );

    expect(changes).toEqual([{ kind: 'replaced', text: 'Fato corrigido.' }]);
  });

  it('adds a memory of the whole project, with no plan on it', () => {
    const { memories, changes } = apply([
      { op: 'add', text: 'O SSO não funciona.', scope: 'project', target: 'all' },
    ]);

    expect(memories.at(-1)).toMatchObject({
      id: 'm-new',
      workspaceId: null,
      createdAt: NOW,
      deletedAt: null,
    });
    expect(changes).toEqual([{ kind: 'added', text: 'O SSO não funciona.' }]);
  });

  it('ties a memory of the plan to its workspace', () => {
    expect(
      apply([
        { op: 'add', text: 'Sem frete FOB.', scope: 'plan', target: 'all' },
      ]).memories.at(-1)?.workspaceId,
    ).toBe('w-1');
  });

  it('adds to this plan the same words another plan already keeps', () => {
    const other = { ...memory, scope: 'plan' as const, workspaceId: 'w-2' };

    expect(
      apply([{ op: 'add', text: 'Em Ajustes.', scope: 'plan', target: 'all' }], [other])
        .changes,
    ).toEqual([{ kind: 'added', text: 'Em Ajustes.' }]);
  });

  it('does not add what is already kept, word for word', () => {
    const { memories, changes } = apply([
      { op: 'add', text: 'Em Ajustes.', scope: 'project', target: 'all' },
    ]);

    expect(memories).toHaveLength(1);
    expect(changes).toEqual([]);
  });

  it('replaces the text and keeps when it was first learned', () => {
    const { memories, changes } = apply([
      { op: 'replace', id: 'm-1', text: 'Em Relatórios.' },
    ]);

    expect(memories).toEqual([{ ...memory, text: 'Em Relatórios.', updatedAt: NOW }]);
    expect(changes).toEqual([{ kind: 'replaced', text: 'Em Relatórios.' }]);
  });

  it('changes the target only when the agent says so', () => {
    expect(
      apply([{ op: 'replace', id: 'm-1', text: 'Só no iOS.', target: 'ios' }]).memories[0]
        ?.target,
    ).toBe('ios');
  });

  it('forgets a memory: no text left, the date stays for the org to hear', () => {
    const { memories, changes } = apply([{ op: 'delete', id: 'm-1' }]);

    expect(memories).toEqual([{ ...memory, text: '', updatedAt: NOW, deletedAt: NOW }]);
    expect(changes).toEqual([{ kind: 'forgotten', text: 'Em Ajustes.' }]);
  });

  it('ignores one that was already forgotten or never existed', () => {
    const gone = { ...memory, text: '', deletedAt: OLD };

    expect(apply([{ op: 'delete', id: 'm-1' }], [gone]).changes).toEqual([]);
    expect(apply([{ op: 'replace', id: 'm-9', text: 'x' }]).changes).toEqual([]);
  });
});
