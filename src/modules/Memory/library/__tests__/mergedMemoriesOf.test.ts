import type { IMemory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { mergedMemoriesOf } from '@/modules/Memory/library';
import { MEMORY_LIMIT } from '@/shared/constants';

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

const NOW = '2026-11-08T10:00:00.000Z';
const many = (props: { prefix: string; count: number; over?: Partial<IMemory> }) =>
  Array.from({ length: props.count }, (_, index) =>
    memory({
      id: `${props.prefix}-${String(index)}`,
      updatedAt: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
      ...props.over,
    }),
  );
const activeOf = (memories: IMemory[]) =>
  memories.filter(({ deletedAt }) => deletedAt === null);

describe('mergedMemoriesOf', () => {
  it('stays within the limit when two machines each filled the project', () => {
    const merged = mergedMemoriesOf({
      local: many({ prefix: 'a', count: MEMORY_LIMIT.project }),
      org: [memory({ id: 'org', updatedAt: '2026-11-07T10:00:00.000Z' })],
      now: NOW,
    });

    expect(activeOf(merged)).toHaveLength(MEMORY_LIMIT.project);
    expect(merged.find(({ id }) => id === 'a-0')).toMatchObject({
      text: '',
      updatedAt: NOW,
      deletedAt: NOW,
    });
  });

  it('stays within the limit of each plan', () => {
    const plan = { scope: 'plan' as const, workspaceId: 'w-1' };

    expect(
      activeOf(
        mergedMemoriesOf({
          local: many({ prefix: 'a', count: MEMORY_LIMIT.plan, over: plan }),
          org: many({ prefix: 'b', count: 2, over: plan }),
          now: NOW,
        }),
      ),
    ).toHaveLength(MEMORY_LIMIT.plan);
  });

  it('lets go of a forgotten one the org already knows about', () => {
    const forgotten = memory({ text: '', deletedAt: NOW, updatedAt: NOW });

    expect(mergedMemoriesOf({ local: [forgotten], org: [forgotten], now: NOW })).toEqual(
      [],
    );
  });

  it('keeps a forgotten one the org has not heard about yet', () => {
    const forgotten = memory({ text: '', deletedAt: NOW, updatedAt: NOW });

    expect(mergedMemoriesOf({ local: [forgotten], org: [memory({})], now: NOW })).toEqual(
      [forgotten],
    );
  });

  it('does not bring in what the org forgot and this machine never had', () => {
    expect(
      mergedMemoriesOf({
        local: [],
        org: [memory({ text: '', deletedAt: NOW, updatedAt: NOW })],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('brings in what a teammate learned', () => {
    expect(
      mergedMemoriesOf({
        local: [memory({ id: 'a' })],
        org: [memory({ id: 'b', createdAt: '2026-11-02T10:00:00.000Z' })],
        now: NOW,
      }).map(({ id }) => id),
    ).toEqual(['a', 'b']);
  });

  it('takes the version written last, on either side', () => {
    const later = { updatedAt: '2026-11-05T10:00:00.000Z' };

    expect(
      mergedMemoriesOf({
        local: [memory({ text: 'daqui' })],
        org: [memory({ text: 'da org', ...later })],
        now: NOW,
      })[0]?.text,
    ).toBe('da org');
    expect(
      mergedMemoriesOf({
        local: [memory({ text: 'daqui', ...later })],
        org: [memory({ text: 'da org' })],
        now: NOW,
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
      mergedMemoriesOf({ local: [memory({})], org: [memory(forgotten)], now: NOW }),
    ).toEqual([]);
    expect(
      mergedMemoriesOf({
        local: [memory({ updatedAt: '2026-11-06T10:00:00.000Z' })],
        org: [memory(forgotten)],
        now: NOW,
      })[0]?.deletedAt,
    ).toBeNull();
  });
});
