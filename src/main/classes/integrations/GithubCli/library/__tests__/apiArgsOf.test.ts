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

  /**
   * O corpo de um pull request passa de muitas linhas e pode ter um = próprio: cada campo
   * vai inteiro, como texto.
   */
  it('posts text fields as they are, whatever they hold', () => {
    expect(
      apiArgsOf({
        path: 'repos/acme/e2e/pulls',
        method: 'POST',
        fields: { title: 'Fix CT-NAV-002', body: 'Line one\n\na = b' },
        jq: '.html_url',
      }),
    ).toEqual([
      'api',
      '--method',
      'POST',
      '--raw-field',
      'title=Fix CT-NAV-002',
      '--raw-field',
      'body=Line one\n\na = b',
      '--jq',
      '.html_url',
      'repos/acme/e2e/pulls',
    ]);
  });
});
