import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { memoryRowsOf } from '@/modules/Memory/library';

const memory = (over: Partial<IMemory>): IMemory => ({
  id: 'm-1',
  text: 'Em Ajustes.',
  scope: 'project',
  workspaceId: null,
  target: 'all',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
  ...over,
});
const WORKSPACES = [{ id: 'w-1', name: 'Cupons' }];

describe('memoryRowsOf', () => {
  it('lists the newest first', () => {
    expect(
      memoryRowsOf({
        memories: [memory({ id: 'old' }), memory({ id: 'new' })],
        workspaces: WORKSPACES,
      }).map(({ memory: one }) => one.id),
    ).toEqual(['new', 'old']);
  });

  it('names the plan of a memory of the plan, and none of the project', () => {
    const rows = memoryRowsOf({
      memories: [
        memory({ id: 'p', scope: 'plan', workspaceId: 'w-1' }),
        memory({ id: 'g' }),
      ],
      workspaces: WORKSPACES,
    });

    expect(rows.map(({ planName }) => planName)).toEqual([null, 'Cupons']);
  });

  it('leaves out one that was forgotten, or whose plan is gone', () => {
    expect(
      memoryRowsOf({
        memories: [
          memory({ deletedAt: '2026-11-02T10:00:00.000Z' }),
          memory({ id: 'x', scope: 'plan', workspaceId: 'w-9' }),
        ],
        workspaces: WORKSPACES,
      }),
    ).toEqual([]);
  });
});
