import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { overLimitOf } from '@/modules/Memory/library';
import { MEMORY_LIMIT } from '@/shared/constants';

const many = (count: number, over: Partial<IMemory> = {}): IMemory[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `m-${String(index)}`,
    text: `Fato ${String(index)}.`,
    scope: 'project',
    workspaceId: null,
    target: 'all',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
    deletedAt: null,
    ...over,
  }));

describe('overLimitOf', () => {
  it('finds nothing at the limit', () => {
    expect(overLimitOf(many(MEMORY_LIMIT.project))).toEqual([]);
  });

  it('picks the ones unchanged the longest, past the limit', () => {
    expect(overLimitOf(many(MEMORY_LIMIT.project + 2)).map(({ id }) => id)).toEqual([
      'm-0',
      'm-1',
    ]);
  });

  it('counts each plan by its own limit', () => {
    const plan = (workspaceId: string) =>
      many(MEMORY_LIMIT.plan, { scope: 'plan', workspaceId });

    expect(overLimitOf([...plan('w-1'), ...plan('w-2')])).toEqual([]);
    expect(
      overLimitOf(many(MEMORY_LIMIT.plan + 1, { scope: 'plan', workspaceId: 'w-1' })),
    ).toHaveLength(1);
  });

  it('never counts what was forgotten', () => {
    expect(
      overLimitOf(
        many(MEMORY_LIMIT.project + 3, { deletedAt: '2026-11-01T10:00:00.000Z' }),
      ),
    ).toEqual([]);
  });
});
