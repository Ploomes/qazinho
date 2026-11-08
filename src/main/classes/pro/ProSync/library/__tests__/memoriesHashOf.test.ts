import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { memoriesHashOf } from '@/main/classes/pro/ProSync/library';

const memory = (over: Partial<IMemory> = {}): IMemory => ({
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

describe('memoriesHashOf', () => {
  it('is the same whatever order the list comes in', () => {
    const a = memory({ id: 'a' });
    const b = memory({ id: 'b' });

    expect(memoriesHashOf([a, b])).toBe(memoriesHashOf([b, a]));
  });

  it('does not care about the order of the keys of a memory', () => {
    const { id, ...rest } = memory();

    expect(memoriesHashOf([{ ...rest, id }])).toBe(memoriesHashOf([memory()]));
  });

  it('changes when a memory is edited or forgotten', () => {
    const base = memoriesHashOf([memory()]);

    expect(memoriesHashOf([memory({ text: 'Em Relatórios.' })])).not.toBe(base);
    expect(memoriesHashOf([memory({ deletedAt: '2026-11-02T10:00:00.000Z' })])).not.toBe(
      base,
    );
  });
});
