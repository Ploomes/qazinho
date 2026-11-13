import { describe, expect, it } from 'vitest';
import { readProjects } from '@/modules/Project/library';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://shop.test' }],
  repositories: [{ id: '4242', owner: 'acme', name: 'shop-web', baseBranch: 'main' }],
};

describe('readProjects', () => {
  it('reads back what QAzinho wrote', () => {
    expect(readProjects(JSON.stringify([PROJECT]))).toEqual([PROJECT]);
  });

  it('a file that is not there yet is no projects, not a crash', () => {
    expect(readProjects('')).toEqual([]);
  });

  it('a file somebody broke by hand is no projects, not a crash', () => {
    expect(readProjects('{ nope')).toEqual([]);
  });

  it('reads a web address an older project saved with no scheme the way a browser opens it', () => {
    const typed = {
      ...PROJECT,
      targets: [
        { id: 't1', kind: 'web', label: 'Web', value: 'loja.test' },
        { id: 't2', kind: 'android', label: 'Android', value: '/x/app.apk' },
      ],
    };

    expect(
      readProjects(JSON.stringify([typed]))[0]?.targets.map(({ value }) => value),
    ).toEqual(['http://loja.test', '/x/app.apk']);
  });

  it('reads a project saved before repositories as made of none', () => {
    const { repositories, ...older } = PROJECT;

    expect(repositories).toHaveLength(1);
    expect(readProjects(JSON.stringify([older]))[0]?.repositories).toEqual([]);
  });

  it('keeps the Jira statuses that mean ready, and drops a list that is not of names', () => {
    const ready = { ...PROJECT, readyStatuses: ['Ready for QA'] };
    const broken = { ...PROJECT, readyStatuses: ['Ready for QA', 7] };

    expect(readProjects(JSON.stringify([ready]))[0]?.readyStatuses).toEqual([
      'Ready for QA',
    ]);
    expect(readProjects(JSON.stringify([broken]))[0]).not.toHaveProperty('readyStatuses');
  });

  it('an entry with no id is skipped, and the rest still load', () => {
    const json = JSON.stringify([{ name: 'no id' }, PROJECT]);

    expect(readProjects(json)).toEqual([PROJECT]);
  });
});
