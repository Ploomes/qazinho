import { describe, expect, it } from 'vitest';
import { repositoryOf } from '@/main/classes/integrations/GithubRepos/library';

describe('repositoryOf', () => {
  it('reads a repository gh printed through the filter', () => {
    expect(
      repositoryOf({
        owner: 'acme',
        name: 'loja-web',
        isPrivate: true,
        defaultBranch: 'develop',
        pushedAt: '2026-10-19T12:00:00Z',
        description: 'The store',
      }),
    ).toEqual({
      owner: 'acme',
      name: 'loja-web',
      isPrivate: true,
      defaultBranch: 'develop',
      pushedAt: '2026-10-19T12:00:00Z',
      description: 'The store',
    });
  });

  it('reads an empty description and a repository never pushed to as missing', () => {
    expect(
      repositoryOf({
        owner: 'acme',
        name: 'empty',
        isPrivate: false,
        defaultBranch: 'main',
        pushedAt: null,
        description: '',
      }),
    ).toMatchObject({ pushedAt: null, description: null });
  });

  it('does NOT read a line without an owner, a name or a default branch', () => {
    expect(repositoryOf({ owner: 'acme', name: 'x' })).toBeNull();
    expect(repositoryOf('acme/x')).toBeNull();
    expect(repositoryOf(null)).toBeNull();
  });
});
