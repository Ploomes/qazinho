import { describe, expect, it } from 'vitest';
import { branchesOf } from '@/main/classes/integrations/GithubRepos/library';

const REPOSITORY = 'acme/loja-web';

describe('branchesOf', () => {
  it("puts the repository's own branch first, then what moved, newest first, then the rest by name", () => {
    expect(
      branchesOf({
        names: ['zeta', 'feat/cupom', 'main', 'alpha', 'fix/frete'],
        defaultBranch: 'main',
        pushes: [
          { ref: 'refs/heads/fix/frete', timestamp: '2026-10-18T10:00:00Z' },
          { ref: 'refs/heads/feat/cupom', timestamp: '2026-10-19T10:00:00Z' },
        ],
        pulls: [],
        repository: REPOSITORY,
      }).map(({ name }) => name),
    ).toEqual(['main', 'feat/cupom', 'fix/frete', 'alpha', 'zeta']);
  });

  it('names the pull request a branch heads, and counts its update as the branch moving', () => {
    const [main, cupom] = branchesOf({
      names: ['main', 'feat/cupom', 'old'],
      defaultBranch: 'main',
      pushes: [{ ref: 'refs/heads/feat/cupom', timestamp: '2026-10-01T10:00:00Z' }],
      pulls: [
        {
          number: 42,
          title: 'Cupom no checkout',
          head: 'feat/cupom',
          headRepo: REPOSITORY,
          updatedAt: '2026-10-19T09:00:00Z',
        },
      ],
      repository: REPOSITORY,
    });

    expect(main).toEqual({
      name: 'main',
      isDefault: true,
      pullRequest: null,
      movedAt: null,
    });
    expect(cupom).toEqual({
      name: 'feat/cupom',
      isDefault: false,
      pullRequest: { number: 42, title: 'Cupom no checkout' },
      movedAt: '2026-10-19T09:00:00Z',
    });
  });

  it("does NOT tie a fork's pull request to a branch of the same name here", () => {
    const [, fix] = branchesOf({
      names: ['main', 'fix'],
      defaultBranch: 'main',
      pushes: [],
      pulls: [
        {
          number: 7,
          title: 'From a fork',
          head: 'fix',
          headRepo: 'someone/loja-web',
          updatedAt: '2026-10-19T09:00:00Z',
        },
      ],
      repository: REPOSITORY,
    });

    expect(fix).toMatchObject({ name: 'fix', pullRequest: null, movedAt: null });
  });

  it('keeps the default branch even when the list of names did not reach it, and ignores tags', () => {
    expect(
      branchesOf({
        names: ['a'],
        defaultBranch: 'main',
        pushes: [{ ref: 'refs/tags/v1', timestamp: '2026-10-19T10:00:00Z' }, 'junk'],
        pulls: [null],
        repository: REPOSITORY,
      }).map(({ name, movedAt }) => ({ name, movedAt })),
    ).toEqual([
      { name: 'main', movedAt: null },
      { name: 'a', movedAt: null },
    ]);
  });
});
