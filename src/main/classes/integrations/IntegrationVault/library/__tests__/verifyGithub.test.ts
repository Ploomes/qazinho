import { describe, expect, it } from 'vitest';
import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';
import { verifyGithub } from '@/main/classes/integrations/IntegrationVault/library';
import { fakeTracker } from './fixtures';

describe('verifyGithub', () => {
  it('connects as the user the token belongs to', async () => {
    const { fetcher, asked } = fakeTracker({ status: 200, body: { login: 'octoqa' } });
    const result = await verifyGithub({ token: '  ghp_abc \n', fetcher });

    expect(result).toMatchObject({
      isConnected: true,
      status: { id: 'github', account: 'octoqa' },
    });
    expect(asked[0]?.headers.Authorization).toBe('Bearer ghp_abc');
  });

  it('does NOT connect with a token GitHub refuses', async () => {
    const { fetcher } = fakeTracker({ status: 401, body: {} });

    expect(await verifyGithub({ token: 'nope', fetcher })).toEqual({
      isConnected: false,
      error: TRACKER_ERRORS.unauthorized,
    });
  });

  it('says the tracker was unreachable when there is no network', async () => {
    const { fetcher } = fakeTracker('offline');

    expect(await verifyGithub({ token: 'x', fetcher })).toEqual({
      isConnected: false,
      error: TRACKER_ERRORS.unreachable,
    });
  });

  it('does NOT connect when the answer names nobody', async () => {
    const { fetcher } = fakeTracker({ status: 200, body: { message: 'hi' } });

    expect(await verifyGithub({ token: 'x', fetcher })).toMatchObject({
      isConnected: false,
    });
  });
});
