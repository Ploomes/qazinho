import type { IConnectResult, IGithubStatus } from '@/shared/types';

/**
 * Se o login da GitHub CLI conecta o GitHub: a conta com que ela está logada, ou por que
 * não pode.
 */
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
