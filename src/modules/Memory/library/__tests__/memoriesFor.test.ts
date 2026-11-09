import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { MEMORY } from '@/modules/Memory/constants';
import { memoriesFor } from '@/modules/Memory/library';
import { MEMORY_LIMIT } from '@/shared/constants';

const memory = (over: Partial<IMemory> = {}): IMemory => ({
  id: 'm-1',
  text: 'Em Ajustes.',
  scope: 'project',
  workspaceId: null,
  target: 'all',
  createdAt: '2026-11-08T10:00:00.000Z',
  updatedAt: '2026-11-08T10:00:00.000Z',
  deletedAt: null,
  ...over,
});

describe('memoriesFor', () => {
  it('reads nothing from a project that never learned anything', () => {
    expect(memoriesFor({ memories: undefined, workspaceId: 'w-1' })).toEqual([]);
  });

  it('gives the agent the id, the fact, the reach and the target', () => {
    expect(memoriesFor({ memories: [memory()], workspaceId: 'w-1' })).toEqual([
      { id: 'm-1', text: 'Em Ajustes.', scope: 'project', target: 'all' },
    ]);
  });

  it('leaves out one that was forgotten', () => {
    expect(
      memoriesFor({
        memories: [memory({ text: '', deletedAt: '2026-11-08T11:00:00.000Z' })],
        workspaceId: 'w-1',
      }),
    ).toEqual([]);
  });

  it('leaves out a memory of another plan and keeps the one of this plan', () => {
    const ids = memoriesFor({
      memories: [
        memory({ id: 'mine', scope: 'plan', workspaceId: 'w-1' }),
        memory({ id: 'theirs', scope: 'plan', workspaceId: 'w-2' }),
      ],
      workspaceId: 'w-1',
    }).map(({ id }) => id);

    expect(ids).toEqual(['mine']);
  });

  it('with a target, leaves out what only holds for another one', () => {
    const ids = memoriesFor({
      memories: [
        memory({ id: 'any' }),
        memory({ id: 'android', target: 'android' }),
        memory({ id: 'ios', target: 'ios' }),
      ],
      workspaceId: 'w-1',
      targetKind: 'android',
    }).map(({ id }) => id);

    expect(ids).toEqual(['any', 'android']);
  });

  it('without a target, shows every one, as the keeper needs to', () => {
    expect(
      memoriesFor({
        memories: [memory({ target: 'ios' })],
        workspaceId: 'w-1',
      }),
    ).toHaveLength(1);
  });

  it('reads all that a full project and a full plan can hold', () => {
    const project = Array.from({ length: MEMORY_LIMIT.project }, (_, i) =>
      memory({ id: `p-${String(i)}` }),
    );
    const plan = Array.from({ length: MEMORY_LIMIT.plan }, (_, i) =>
      memory({ id: `w-${String(i)}`, scope: 'plan', workspaceId: 'w-1' }),
    );

    expect(
      memoriesFor({ memories: [...project, ...plan], workspaceId: 'w-1' }),
    ).toHaveLength(MEMORY_LIMIT.project + MEMORY_LIMIT.plan);
  });

  it('keeps only the most recent ones', () => {
    const many = Array.from({ length: MEMORY.shown + 3 }, (_, i) =>
      memory({ id: `m-${String(i)}` }),
    );
    const shown = memoriesFor({ memories: many, workspaceId: 'w-1' });

    expect(shown).toHaveLength(MEMORY.shown);
    expect(shown.at(-1)?.id).toBe(`m-${String(MEMORY.shown + 2)}`);
  });
});
