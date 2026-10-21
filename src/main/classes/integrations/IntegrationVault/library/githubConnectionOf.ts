import type { IConnectResult, IGithubStatus } from '@/shared/types';
import { GITHUB_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';

/** Whether the GitHub CLI's login connects GitHub: the account it is signed in as, or why it cannot. */
export function githubConnectionOf(props: {
  status: IGithubStatus;
  at: string;
}): IConnectResult {
  const { status } = props;

  if (status.account === null)
    return { isConnected: false, error: GITHUB_ERRORS[status.failure ?? 'signed-out'] };

  if (status.missingScopes.length > 0)
    return {
      isConnected: false,
      error: GITHUB_ERRORS.scopes.replace('{scopes}', status.missingScopes.join(', ')),
    };

  return {
    isConnected: true,
    status: { id: 'github', account: status.account, site: null, connectedAt: props.at },
  };
}
