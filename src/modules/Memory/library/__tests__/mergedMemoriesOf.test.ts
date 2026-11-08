import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { mergedMemoriesOf } from '@/modules/Memory/library';

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

describe('mergedMemoriesOf', () => {
  it('brings in what a teammate learned', () => {
    expect(
      mergedMemoriesOf({
        local: [memory({ id: 'a' })],
        org: [memory({ id: 'b', createdAt: '2026-11-02T10:00:00.000Z' })],
      }).map(({ id }) => id),
    ).toEqual(['a', 'b']);
  });

  it('takes the version written last, on either side', () => {
    const later = { updatedAt: '2026-11-05T10:00:00.000Z' };

    expect(
      mergedMemoriesOf({
        local: [memory({ text: 'daqui' })],
        org: [memory({ text: 'da org', ...later })],
      })[0]?.text,
    ).toBe('da org');
    expect(
      mergedMemoriesOf({
        local: [memory({ text: 'daqui', ...later })],
        org: [memory({ text: 'da org' })],
      })[0]?.text,
    ).toBe('daqui');
  });

  it('a memory forgotten later stays forgotten, and one edited later comes back', () => {
    const forgotten = {
      text: '',
      updatedAt: '2026-11-05T10:00:00.000Z',
      deletedAt: '2026-11-05T10:00:00.000Z',
    };

    expect(
      mergedMemoriesOf({ local: [memory({})], org: [memory(forgotten)] })[0]?.deletedAt,
    ).not.toBeNull();
    expect(
      mergedMemoriesOf({
        local: [memory({ updatedAt: '2026-11-06T10:00:00.000Z' })],
        org: [memory(forgotten)],
      })[0]?.deletedAt,
    ).toBeNull();
  });
});
