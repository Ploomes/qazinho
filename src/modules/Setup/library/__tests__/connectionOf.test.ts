import { describe, expect, it } from 'vitest';
import { connectionOf } from '@/modules/Setup/library';

describe('connectionOf', () => {
  it('needs only a token for GitHub, trimmed', () => {
    expect(connectionOf({ id: 'github', values: { token: ' ghp_x \n' } })).toEqual({
      id: 'github',
      token: 'ghp_x',
    });
  });

  it('needs the site, the email and the token for Jira', () => {
    expect(
      connectionOf({
        id: 'jira',
        values: { site: 'acme.atlassian.net', email: 'qa@acme.test', token: 't' },
      }),
    ).toEqual({
      id: 'jira',
      site: 'acme.atlassian.net',
      email: 'qa@acme.test',
      token: 't',
    });
  });

  it('does NOT connect Jira while a field is empty', () => {
    expect(
      connectionOf({ id: 'jira', values: { site: 'acme.atlassian.net', token: 't' } }),
    ).toBeNull();
  });

  it('does NOT connect anything without a token', () => {
    expect(connectionOf({ id: 'github', values: { token: '   ' } })).toBeNull();
  });
});
