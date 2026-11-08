import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { hasNewMemories, memoriesHashOf } from '@/main/classes/pro/ProSync/library';

const MEMORY: IMemory = {
  id: 'm-1',
  text: 'Em Ajustes.',
  scope: 'project',
  workspaceId: null,
  target: 'all',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
};
const recordWith = (memories: string | null) => ({ memories }) as IProSyncRecord;

describe('hasNewMemories', () => {
  it('is nothing new when neither side ever had one', () => {
    expect(hasNewMemories({ record: recordWith(null), memories: [] })).toBe(false);
  });

  it('sees the first memory of a project', () => {
    expect(hasNewMemories({ record: recordWith(null), memories: [MEMORY] })).toBe(true);
  });

  it('is nothing new when the list is the one both sides saw', () => {
    expect(
      hasNewMemories({
        record: recordWith(memoriesHashOf([MEMORY])),
        memories: [MEMORY],
      }),
    ).toBe(false);
  });

  it('sees a list that went empty after having something', () => {
    expect(
      hasNewMemories({ record: recordWith(memoriesHashOf([MEMORY])), memories: [] }),
    ).toBe(true);
  });
});
