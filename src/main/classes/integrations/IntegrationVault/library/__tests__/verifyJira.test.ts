import { describe, expect, it } from 'vitest';
import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';
import { verifyJira } from '@/main/classes/integrations/IntegrationVault/library';
import { fakeTracker } from './fixtures';

const CREDENTIALS = { site: 'acme.atlassian.net', email: 'qa@acme.test', token: 'tok' };

describe('verifyJira', () => {
  it('connects as the person Jira says the token is, on the site as an origin', async () => {
    const { fetcher, asked } = fakeTracker({
      status: 200,
      body: { displayName: 'Ana QA' },
    });
    const result = await verifyJira({ credentials: CREDENTIALS, fetcher });

    expect(result).toMatchObject({
      isConnected: true,
      status: { id: 'jira', account: 'Ana QA', site: 'https://acme.atlassian.net' },
    });
    expect(asked[0]?.url).toBe('https://acme.atlassian.net/rest/api/3/myself');
    expect(asked[0]?.headers.Authorization).toBe(
      `Basic ${Buffer.from('qa@acme.test:tok').toString('base64')}`,
    );
  });

  it('falls back to the email when Jira gives no name', async () => {
    const { fetcher } = fakeTracker({ status: 200, body: {} });

    expect(await verifyJira({ credentials: CREDENTIALS, fetcher })).toMatchObject({
      status: { account: 'qa@acme.test' },
    });
  });

  it('does NOT ask anything of a site that is not an address', async () => {
    const { fetcher, asked } = fakeTracker({ status: 200, body: {} });

    expect(
      await verifyJira({ credentials: { ...CREDENTIALS, site: 'acme' }, fetcher }),
    ).toEqual({ isConnected: false, error: TRACKER_ERRORS.badSite });
    expect(asked).toHaveLength(0);
  });

  it('does NOT connect with credentials Jira refuses', async () => {
    const { fetcher } = fakeTracker({ status: 403, body: {} });

    expect(await verifyJira({ credentials: CREDENTIALS, fetcher })).toEqual({
      isConnected: false,
      error: TRACKER_ERRORS.unauthorized,
    });
  });
});
