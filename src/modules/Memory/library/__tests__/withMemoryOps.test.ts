import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { withMemoryOps } from '@/modules/Memory/library';

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

describe('withMemoryOps', () => {
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
