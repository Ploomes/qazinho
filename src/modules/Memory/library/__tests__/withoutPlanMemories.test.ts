import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { withoutPlanMemories } from '@/modules/Memory/library';

const NOW = '2026-11-08T10:00:00.000Z';
const memory = (over: Partial<IMemory>): IMemory => ({
  id: 'm-1',
  text: 'Fato.',
  scope: 'plan',
  workspaceId: 'w-1',
  target: 'all',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
  ...over,
});

describe('withoutPlanMemories', () => {
  it('forgets the memories of the plan that went away, for the org to hear', () => {
    expect(
      withoutPlanMemories({ memories: [memory({})], workspaceId: 'w-1', now: NOW }),
    ).toEqual([memory({ text: '', updatedAt: NOW, deletedAt: NOW })]);
  });

  it('leaves the project and the other plans alone', () => {
    const others = [
      memory({ scope: 'project', workspaceId: null }),
      memory({ id: 'm-2', workspaceId: 'w-2' }),
    ];

    expect(withoutPlanMemories({ memories: others, workspaceId: 'w-1', now: NOW })).toBe(
      others,
    );
  });
});
