import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';
import { describe, expect, it, vi } from 'vitest';
import { GithubRepos } from '@/main/classes/integrations/GithubRepos';

const MISSING: GhAnswer = {
  isOk: false,
  failure: 'not-found',
  httpStatus: 404,
  said: '',
};

/** A GitHub that answers each path from a table, by the first prefix it starts with, and remembers every path it was asked. */
function fakeGithub(table: Record<string, GhAnswer>) {
  const asked: string[] = [];
  const api = vi.fn((props: { path: string }): Promise<GhAnswer> => {
    asked.push(props.path);

    const match = Object.entries(table).find(([prefix]) => props.path.startsWith(prefix));

    return Promise.resolve(match === undefined ? MISSING : match[1]);
  });

  return { github: { api }, asked };
}

const ok = (text: string): GhAnswer => ({ isOk: true, text });

describe('GithubRepos', () => {
  describe('repositories', () => {
    it("lists the QA's repositories, and keeps the list for a few minutes", async () => {
      let now = 0;
      const { github, asked } = fakeGithub({
        'user/repos': ok(
          '{"owner":"acme","name":"loja-web","isPrivate":true,"defaultBranch":"main","pushedAt":"2026-10-19T10:00:00Z","description":null}\n',
        ),
      });
      const repos = new GithubRepos({ github, now: () => now });

      expect(await repos.repositories()).toEqual({
        isListed: true,
        repositories: [
          {
            owner: 'acme',
            name: 'loja-web',
            isPrivate: true,
            defaultBranch: 'main',
            pushedAt: '2026-10-19T10:00:00Z',
            description: null,
          },
        ],
      });

      now = 60_000;
      await repos.repositories();

      expect(asked).toHaveLength(1);

      now = 6 * 60_000;
      await repos.repositories();

      expect(asked).toHaveLength(2);
    });

    it('says why GitHub would not list them, and keeps nothing', async () => {
      const { github, asked } = fakeGithub({
        'user/repos': { isOk: false, failure: 'signed-out', httpStatus: null, said: '' },
      });
      const repos = new GithubRepos({ github });

      expect(await repos.repositories()).toEqual({
        isListed: false,
        failure: 'signed-out',
      });
      await repos.repositories();

      expect(asked).toHaveLength(2);
    });
  });

  describe('branches', () => {
    it('reads every page of names until one comes back short', async () => {
      const full = Array.from({ length: 100 }, (_, index) => `b-${String(index)}`).join(
        '\n',
      );
      const { github, asked } = fakeGithub({
        'repos/acme/loja-web/branches?per_page=100&page=1': ok(full),
        'repos/acme/loja-web/branches?per_page=100&page=2': ok('main\nfeat/cupom'),
        'repos/acme/loja-web/activity': ok(''),
        'repos/acme/loja-web/pulls': ok(''),
        'repos/acme/loja-web': ok('main\n'),
      });
      const list = await new GithubRepos({ github }).branches({
        owner: 'acme',
        name: 'loja-web',
      });

      expect(list.isListed && list.branches).toHaveLength(102);
      expect(list.isListed && list.branches[0]).toMatchObject({
        name: 'main',
        isDefault: true,
      });
      expect(asked.filter((path) => path.includes('/branches?'))).toHaveLength(2);
    });

    it('lists the branches even when the activity and the pull requests cannot be read', async () => {
      const { github } = fakeGithub({
        'repos/acme/loja-web/branches': ok('main\nfeat/cupom'),
        'repos/acme/loja-web/activity': {
          isOk: false,
          failure: 'not-found',
          httpStatus: 404,
          said: '',
        },
        'repos/acme/loja-web/pulls': {
          isOk: false,
          failure: 'denied',
          httpStatus: 403,
          said: '',
        },
        'repos/acme/loja-web': ok('main'),
      });

      expect(
        await new GithubRepos({ github }).branches({ owner: 'acme', name: 'loja-web' }),
      ).toEqual({
        isListed: true,
        branches: [
          { name: 'main', isDefault: true, pullRequest: null, movedAt: null },
          { name: 'feat/cupom', isDefault: false, pullRequest: null, movedAt: null },
        ],
      });
    });

    it('says GitHub did not find a repository the QA cannot read', async () => {
      const { github } = fakeGithub({});

      expect(
        await new GithubRepos({ github }).branches({ owner: 'acme', name: 'secret' }),
      ).toEqual({ isListed: false, failure: 'not-found' });
    });
  });
});
