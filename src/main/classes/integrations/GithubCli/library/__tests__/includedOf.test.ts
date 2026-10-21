import { describe, expect, it } from 'vitest';
import { includedOf } from '@/main/classes/integrations/GithubCli/library';

describe('includedOf', () => {
  it('splits the status, the headers by lower-case name, and the body', () => {
    expect(
      includedOf(
        'HTTP/2.0 200 OK\nX-Oauth-Scopes: gist, read:org, repo\nContent-Type: application/json\n\n{"login":"octoqa"}',
      ),
    ).toEqual({
      status: 200,
      headers: {
        'x-oauth-scopes': 'gist, read:org, repo',
        'content-type': 'application/json',
      },
      body: '{"login":"octoqa"}',
    });
  });

  it('reads Windows line ends the same way', () => {
    expect(includedOf('HTTP/1.1 401 Unauthorized\r\nX-A: b\r\n\r\n{}')).toEqual({
      status: 401,
      headers: { 'x-a': 'b' },
      body: '{}',
    });
  });

  it('gives an empty body and status 0 for something that is not a response', () => {
    expect(includedOf('gh: not a response')).toEqual({
      status: 0,
      headers: {},
      body: '',
    });
  });
});
