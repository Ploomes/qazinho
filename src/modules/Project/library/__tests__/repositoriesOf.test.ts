import { describe, expect, it } from 'vitest';
import { repositoriesOf } from '@/modules/Project/library';

describe('repositoriesOf', () => {
  it('reads each repository with its base branch, and its GitHub id when it was kept', () => {
    expect(
      repositoriesOf([
        { id: '4242', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { owner: 'acme', name: 'loja-api', baseBranch: 'main' },
      ]),
    ).toEqual([
      { id: '4242', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      { id: null, owner: 'acme', name: 'loja-api', baseBranch: 'main' },
    ]);
  });

  it('reads a project saved before repositories as having none', () => {
    expect(repositoriesOf(undefined)).toEqual([]);
    expect(repositoriesOf('acme/loja-web')).toEqual([]);
  });

  it('skips an entry missing its owner, its name or its base branch, and keeps the rest', () => {
    expect(
      repositoriesOf([
        { owner: 'acme', name: 'loja-web' },
        { owner: '', name: 'x', baseBranch: 'main' },
        null,
        { owner: 'acme', name: 'loja-api', baseBranch: 'main', extra: true },
      ]),
    ).toEqual([{ id: null, owner: 'acme', name: 'loja-api', baseBranch: 'main' }]);
  });
});
