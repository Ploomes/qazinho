import { describe, expect, it } from 'vitest';
import { missingScopesOf } from '@/main/classes/integrations/GithubCli/library';

describe('missingScopesOf', () => {
  it('finds nothing missing in the scopes gh asks for when it signs in', () => {
    expect(missingScopesOf('gist, read:org, repo, workflow')).toEqual([]);
  });

  it('names the scopes a narrower token lacks', () => {
    expect(missingScopesOf('gist')).toEqual(['repo', 'read:org']);
    expect(missingScopesOf('')).toEqual(['repo', 'read:org']);
  });

  it('counts a wider org scope as reading the org', () => {
    expect(missingScopesOf('repo, admin:org')).toEqual([]);
  });

  it('does NOT judge a token GitHub sent no scopes header for', () => {
    expect(missingScopesOf(undefined)).toEqual([]);
  });
});
