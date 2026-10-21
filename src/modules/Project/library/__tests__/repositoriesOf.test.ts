import { describe, expect, it } from 'vitest';
import { repositoriesOf } from '@/modules/Project/library';

describe('repositoriesOf', () => {
  it('reads each repository with its base branch', () => {
    expect(
      repositoriesOf([
        { owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { owner: 'acme', name: 'loja-api', baseBranch: 'main' },
      ]),
    ).toEqual([
      { owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      { owner: 'acme', name: 'loja-api', baseBranch: 'main' },
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
    ).toEqual([{ owner: 'acme', name: 'loja-api', baseBranch: 'main' }]);
  });
});
