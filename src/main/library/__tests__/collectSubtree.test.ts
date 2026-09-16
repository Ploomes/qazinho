import type { IProcessRow } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { collectSubtree } from '@/main/library';

function row(props: { pid: number; parentPid: number }): IProcessRow {
  const name = `process-${String(props.pid)}`;

  return { ...props, cpu: 1, ramMb: 10, name, command: name };
}

const ROWS = [
  row({ pid: 1, parentPid: 0 }),
  row({ pid: 100, parentPid: 1 }),
  row({ pid: 200, parentPid: 100 }),
  row({ pid: 300, parentPid: 200 }),
  row({ pid: 400, parentPid: 1 }),
];

describe('collectSubtree', () => {
  it('charges a grandchild to the root, because an agent spawns a shell first', () => {
    const subtree = collectSubtree({ rows: ROWS, rootPid: 100 });

    expect(subtree.map(({ pid }) => pid)).toEqual([200, 300]);
  });

  it('leaves a sibling branch alone', () => {
    expect(collectSubtree({ rows: ROWS, rootPid: 400 })).toEqual([]);
  });

  it('answers nothing for a pid this sweep never saw', () => {
    expect(collectSubtree({ rows: ROWS, rootPid: 999 })).toEqual([]);
  });

  it('does NOT loop forever when a row claims to be its own parent', () => {
    const looping = [...ROWS, row({ pid: 500, parentPid: 500 })];

    expect(collectSubtree({ rows: looping, rootPid: 500 }).map(({ pid }) => pid)).toEqual(
      [500],
    );
  });
});
