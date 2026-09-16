import { describe, expect, it } from 'vitest';
import { readProjects } from '@/modules/Project/library';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://shop.test' }],
};

describe('readProjects', () => {
  it('reads back what gocrash wrote', () => {
    expect(readProjects(JSON.stringify([PROJECT]))).toEqual([PROJECT]);
  });

  it('a file that is not there yet is no projects, not a crash', () => {
    expect(readProjects('')).toEqual([]);
  });

  it('a file somebody broke by hand is no projects, not a crash', () => {
    expect(readProjects('{ nope')).toEqual([]);
  });

  it('an entry with no id is skipped, and the rest still load', () => {
    const json = JSON.stringify([{ name: 'no id' }, PROJECT]);

    expect(readProjects(json)).toEqual([PROJECT]);
  });
});
