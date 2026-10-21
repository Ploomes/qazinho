import { describe, expect, it } from 'vitest';
import { apiArgsOf } from '@/main/classes/integrations/GithubCli/library';

describe('apiArgsOf', () => {
  it('asks for one path as it is', () => {
    expect(apiArgsOf({ path: 'user' })).toEqual(['api', 'user']);
  });

  it('adds the Accept header, every page and the jq filter, before the path', () => {
    expect(
      apiArgsOf({
        path: 'user/repos?per_page=100',
        accept: 'application/vnd.github.diff',
        paginate: true,
        jq: '.[]',
      }),
    ).toEqual([
      'api',
      '-H',
      'Accept: application/vnd.github.diff',
      '--paginate',
      '--jq',
      '.[]',
      'user/repos?per_page=100',
    ]);
  });
});
