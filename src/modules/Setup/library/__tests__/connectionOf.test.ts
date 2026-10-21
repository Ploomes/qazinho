import { describe, expect, it } from 'vitest';
import { connectionOf } from '@/modules/Setup/library';

describe('connectionOf', () => {
  it("needs nothing typed for GitHub, which goes through the QA's own GitHub CLI", () => {
    expect(connectionOf({ id: 'github', values: {} })).toEqual({ id: 'github' });
  });

  it('needs the site, the email and the token for Jira, trimmed', () => {
    expect(
      connectionOf({
        id: 'jira',
        values: { site: ' acme.atlassian.net ', email: 'qa@acme.test', token: 't\n' },
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
    expect(
      connectionOf({
        id: 'jira',
        values: { site: 'acme.atlassian.net', email: 'qa@acme.test', token: '   ' },
      }),
    ).toBeNull();
  });
});
