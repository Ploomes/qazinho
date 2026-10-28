import type { Fetcher } from '@/main/classes/integrations/IntegrationVault/types';
import type { IConnectResult } from '@/shared/types';
import { jiraSiteOf } from './jiraSiteOf';
import { trackerRefusal } from './trackerRefusal';

/**
 * Pergunta ao Jira Cloud de quem são um e-mail e um token de API, no site que o QA
 * nomeou.
 */
export async function verifyJira(props: {
  credentials: { site: string; email: string; token: string };
  fetcher: Fetcher;
}): Promise<IConnectResult> {
  const { credentials, fetcher } = props;
  const site = jiraSiteOf(credentials.site);

  if (site === null) return { isConnected: false, failure: { reason: 'bad-site' } };

  const basic = Buffer.from(
    `${credentials.email.trim()}:${credentials.token.trim()}`,
  ).toString('base64');
  const answer = await fetcher(`${site}/rest/api/3/myself`, {
    headers: { Accept: 'application/json', Authorization: `Basic ${basic}` },
  }).catch(() => null);

  const refused = trackerRefusal(answer);

  if (refused !== null || answer === null)
    return { isConnected: false, failure: refused ?? { reason: 'unreachable' } };

  const me = (await answer.json()) as { displayName?: unknown; emailAddress?: unknown };
  const account =
    typeof me.displayName === 'string' ? me.displayName : credentials.email.trim();

  return {
    isConnected: true,
    status: { id: 'jira', account, site, connectedAt: new Date().toISOString() },
  };
}
