import type { IConnectResult, IGithubStatus } from '@/shared/types';

/** Whether the GitHub CLI's login connects GitHub: the account it is signed in as, or why it cannot. */
export function githubConnectionOf(props: {
  status: IGithubStatus;
  at: string;
}): IConnectResult {
  const { status } = props;

  if (status.account === null)
    return {
      isConnected: false,
      failure: { reason: 'github', failure: status.failure ?? 'signed-out' },
    };

  if (status.missingScopes.length > 0)
    return {
      isConnected: false,
      failure: { reason: 'scopes', scopes: status.missingScopes },
    };

  return {
    isConnected: true,
    status: { id: 'github', account: status.account, site: null, connectedAt: props.at },
  };
}
