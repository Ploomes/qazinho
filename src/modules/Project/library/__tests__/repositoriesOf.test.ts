import { describe, expect, it } from 'vitest';
import { repositoriesOf } from '@/modules/Project/library';

describe('repositoriesOf', () => {
  it('reads each repository with its GitHub id and its base branch', () => {
    expect(
      repositoriesOf([
        { id: '101', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { id: '103', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
      ]),
    ).toEqual([
      { id: '101', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      { id: '103', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
    ]);
  });

  it('reads no repository out of what is not a list', () => {
    expect(repositoriesOf(undefined)).toEqual([]);
    expect(repositoriesOf('acme/loja-web')).toEqual([]);
  });

  it('skips an entry missing its id, its owner, its name or its base branch, and keeps the rest', () => {
    expect(
      repositoriesOf([
        { owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { id: '', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { id: '101', owner: 'acme', name: 'loja-web' },
        { id: '102', owner: '', name: 'x', baseBranch: 'main' },
        null,
        { id: '103', owner: 'acme', name: 'loja-api', baseBranch: 'main', extra: true },
      ]),
    ).toEqual([{ id: '103', owner: 'acme', name: 'loja-api', baseBranch: 'main' }]);
  });
});
