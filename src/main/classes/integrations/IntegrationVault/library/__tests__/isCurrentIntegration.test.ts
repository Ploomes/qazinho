import { describe, expect, it } from 'vitest';
import { isCurrentIntegration } from '@/main/classes/integrations/IntegrationVault/library';

const STATUS = { account: 'octoqa', site: null, connectedAt: '2026-10-20T09:00:00.000Z' };

describe('isCurrentIntegration', () => {
  it('keeps GitHub connected through the GitHub CLI', () => {
    expect(
      isCurrentIntegration({
        status: { id: 'github', ...STATUS },
        credentials: { id: 'github' },
      }),
    ).toBe(true);
  });

  it('does NOT keep GitHub connected with a pasted token from before gh', () => {
    expect(
      isCurrentIntegration({
        status: { id: 'github', ...STATUS },
        credentials: { id: 'github', token: 'ghp_old' } as { id: 'github' },
      }),
    ).toBe(false);
  });

  it('keeps Jira and its token', () => {
    expect(
      isCurrentIntegration({
        status: { id: 'jira', ...STATUS, site: 'https://acme.atlassian.net' },
        credentials: {
          id: 'jira',
          site: 'acme.atlassian.net',
          email: 'qa@acme.test',
          token: 't',
        },
      }),
    ).toBe(true);
  });
});
