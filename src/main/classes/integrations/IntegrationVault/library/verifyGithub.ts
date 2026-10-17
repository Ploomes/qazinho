import type { Fetcher } from '@/main/classes/integrations/IntegrationVault/types';
import type { IConnectResult } from '@/shared/types';
import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';
import { trackerRefusal } from './trackerRefusal';

/** Asks GitHub who a token belongs to. A token that cannot say who it is does not get stored. */
export async function verifyGithub(props: {
  token: string;
  fetcher: Fetcher;
}): Promise<IConnectResult> {
  const answer = await props
    .fetcher('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${props.token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    .catch(() => null);

  const refused = trackerRefusal(answer);

  if (refused !== null || answer === null)
    return { isConnected: false, error: refused ?? TRACKER_ERRORS.unreachable };

  const user = (await answer.json()) as { login?: unknown };

  if (typeof user.login !== 'string')
    return {
      isConnected: false,
      error: TRACKER_ERRORS.unexpected.replace('{status}', String(answer.status)),
    };

  return {
    isConnected: true,
    status: {
      id: 'github',
      account: user.login,
      site: null,
      connectedAt: new Date().toISOString(),
    },
  };
}
